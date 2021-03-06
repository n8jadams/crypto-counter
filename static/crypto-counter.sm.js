import { Machine, assign } from './web_modules/xstate.js'
import { toUSD } from './utils/to-usd.js'

export const UPDATE_ROW = 'UPDATE_ROW'
export const EDIT_NEW_ROW = 'EDIT_NEW_ROW'
export const ADD_ROW = 'ADD_ROW'
export const DELETE_ROW = 'DELETE_ROW'
export const FETCH_PRICES = 'FETCH_PRICES'
export const CLEAR_ERRORS = 'CLEAR_ERRORS'
export const EXPORT_TABLE = 'EXPORT_TABLE'
export const IMPORT_TABLE = 'IMPORT_TABLE'

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
  lastUpdated: new Date
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
        src: 'loadData',
        onDone: {
          actions: assign((_, event) => {
            const { fullDbTable, lastUpdated } = event.data
            const table = fullDbTable.reduce((acc, row) => {
              const fullRow = {
                ...row,
                total: toUSD(Number(row.quantity) * Number(row.price)),
              }
              acc.rows.push(fullRow)
              acc.finalTotal = toUSD(Number(acc.finalTotal) + Number(fullRow.total))
              return acc
            }, initialTableValue())
            return { table, lastUpdated }
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
                  row.key = row.key.toLowerCase()
                  row.symbol = row.symbol.toUpperCase()
                  row.total = toUSD(Number(row.quantity) * Number(row.price))
                }
                acc.rows.push(row)
                acc.finalTotal = toUSD(Number(acc.finalTotal) + Number(row.total))
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
              const { body, lastUpdated } = event.data
              const table = context.table.rows.reduce((acc, row) => {
                let newPrice = 0
                let newMarketcap = '?'
                if (
                  body[row.key] &&
                  !isNaN(Number(body[row.key].usd))
                ) {
                  newPrice = body[row.key].usd
                  newMarketcap = Number(toUSD(body[row.key].usd_market_cap)).toLocaleString('en')
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
              return { table, lastUpdated }
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
    },
    [EXPORT_TABLE]: {
      actions: 'exportTable'
    },
    [IMPORT_TABLE]: {
      actions: [
        assign((_, { rowsMinusTotals }) => {
          const table = rowsMinusTotals.reduce((acc, row) => {
            const fullRow = {
              ...row,
              marketcap: row.marketcap === 0 ? '?' : Number(toUSD(row.marketcap)).toLocaleString('en'),
              total: toUSD(Number(row.quantity) * Number(row.price)),
            }
            acc.rows.push(fullRow)
            acc.finalTotal = toUSD(Number(acc.finalTotal) + Number(fullRow.total))
            return acc
          }, initialTableValue())
          return { table }
        }),
        'saveDatabase'
      ]
    }
  }
})
