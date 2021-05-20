import { Machine, assign } from './web_modules/xstate.js'
import { toUSD } from './utils/to-usd.js'

export const UPDATE_ROW = 'UPDATE_ROW'
export const EDIT_NEW_ROW = 'EDIT_NEW_ROW'
export const ADD_ROW = 'ADD_ROW'
export const DELETE_ROW = 'DELETE_ROW'
export const FETCH_PRICES = 'FETCH_PRICES'
export const CLEAR_ERRORS = 'CLEAR_ERRORS'

const initialNewTableRow = {
  marketcap: '?',
  key: '',
  symbol: '',
  quantity: 0,
  price: '0.00',
  total: '0.00',
  error: false,
}

const initialTableValue = () => ({ finalTotal: 0, rows: [] })

const emptyState = {
  table: {
    ...initialTableValue(),
  },
  newRow: {
    ...initialNewTableRow,
  },
  fetchPricesError: false,
}

export const cryptoCounterMachine = Machine({
  id: 'crypto-counter',
  initial: 'initial',
  context: {
    ...emptyState,
  },
  states: {
    initial: {
      invoke: {
        src: 'importDatabase',
        onDone: {
          actions: assign((_, event) => {
            const table = event.data.reduce((acc, row) => {
              const fullRow = {
                ...row,
                total: toUSD(Number(row.quantity) * Number(row.price)),
              }
              acc.rows.push(fullRow)
              acc.finalTotal = toUSD(Number(acc.finalTotal) + Number(fullRow.total))
              return acc
            }, initialTableValue())
            return { table }
          }),
          target: 'editing',
        },
      },
    },
    editing: {
      on: {
        [EDIT_NEW_ROW]: {
          actions: assign(({ newRow }, { mutation }) => {
						const updatedRow = {
							...newRow,
							...mutation,
							error: false
						}
            return {
              newRow: {
                ...updatedRow,
								total: toUSD(Number(updatedRow.quantity) * Number(updatedRow.price))
              },
            }
          }),
        },
        [UPDATE_ROW]: {
          actions: [
            assign((context, { mutation }) => {
              const table = context.table.rows.reduce((acc, row) => {
                if (row.key === mutation.key) {
                  row = {
                    ...row,
                    ...mutation,
                  }
                }
                row.key = row.key.toLowerCase()
                row.symbol = row.symbol.toUpperCase()
                row.total = toUSD(Number(row.quantity) * Number(row.price))
                acc.rows.push(row)
                acc.finalTotal = toUSD(Number(acc.finalTotal + row.total))
                return acc
              }, initialTableValue())
              return { table, fetchPricesError: false }
            }),
            'saveDatabase',
          ],
        },
        [ADD_ROW]: [
          {
            cond: ({ table, newRow }) => {
              const keyIsTakenAlready = table.rows.some(
                (row) => row.key === newRow.key
              )
              return (
                newRow.key === '' || newRow.name === '' || keyIsTakenAlready
              )
            },
            actions: assign(({ newRow }) => ({
              newRow: {
                ...newRow,
                key: newRow.key.toLowerCase(),
                symbol: newRow.symbol.toUpperCase(),
                error: 'Invalid form',
              },
            })),
          },
          {
            actions: [
              assign(({ table, newRow }) => {
                const rows = table.rows.concat(newRow)
                const finalTotal = toUSD(table.finalTotal + newRow.total)
                return {
                  table: {
                    rows,
                    finalTotal,
                  },
                  newRow: initialNewTableRow,
                }
              }),
              'saveDatabase',
            ],
          },
        ],
        [DELETE_ROW]: {
          actions: [
            assign(({ table }, { key }) => {
              const rowToRemove = table.rows.find((row) => row.key === key)
              const rows = table.rows.filter((row) => row.key !== key)
              const finalTotal = toUSD(Number(table.finalTotal) - Number(rowToRemove.total))
              return {
                table: {
                  rows,
                  finalTotal,
                },
                fetchPricesError: false,
              }
            }),
            'saveDatabase',
          ],
        },
        [FETCH_PRICES]: {
          actions: assign(() => ({
            fetchPricesError: false,
          })),
          target: 'loadingPrices',
        },
      },
    },
    loadingPrices: {
      invoke: {
        src: 'loadPrices',
        onDone: {
          actions: [
            assign((context, event) => {
              const table = context.table.rows.reduce((acc, row) => {
                let newPrice = 0
                let newMarketcap = '?'
                if (
                  event.data[row.key] &&
                  !isNaN(Number(event.data[row.key].usd))
                ) {
                  newPrice = event.data[row.key].usd
                  newMarketcap = Number(toUSD(event.data[row.key].usd_market_cap)).toLocaleString('en')
                }
                const adjustedRow = {
                  ...row,
                  price: newPrice,
                  marketcap: newMarketcap,
                  total: toUSD(Number(row.quantity) * Number(newPrice))
                }
                acc.rows.push(adjustedRow)
                acc.finalTotal = toUSD(Number(acc.finalTotal) + Number(adjustedRow.total))
                return acc
              }, initialTableValue())
              return { table }
            }),
            'saveDatabase',
          ],
          target: 'editing',
        },
        onError: {
          actions: assign((_, error) => ({
            fetchPricesError: error,
          })),
        },
      },
    },
  },
  on: {
    [CLEAR_ERRORS]: {
      actions: assign(({ newRow }) => {
        return {
          newRow: {
            ...newRow,
            error: false
          },
          fetchPricesError: false
        }
      })
    }
  }
})
