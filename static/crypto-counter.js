import { html } from './web_modules/htm/preact.js'
import { useRef, useEffect } from './web_modules/preact/hooks.js' 
import css from './web_modules/csz.js'
import { db } from './crypto-db.js'
import { useMachine } from './web_modules/@xstate/react.js'

import { 
  cryptoCounterMachine,
  UPDATE_ROW,
  EDIT_NEW_ROW,
  ADD_ROW,
  DELETE_ROW,
  FETCH_PRICES,
  CLEAR_ERRORS
} from './crypto-counter.sm.js'

import { toUSD } from './utils/to-usd.js'
import { KeyInput } from './components/key-input.js'
import { NameInput } from './components/name-input.js'
import { QuantityInput } from './components/quantity-input.js'
import { PriceInput } from './components/price-input.js'
import { RefreshIconSvg } from './components/refresh-icon-svg.js'

const styles = css`
  * {
    font-size: 13px;
  }

	h1 {
		font-size: 32px;
    font-family: "Avenir Next", sans-serif;
    margin: 10px;
	}

  h2 {
    font-size: 10px;
    font-family: "Avenir Next", sans-serif;
    color: #737373;
    margin: -5px 15px 10px;
  }

  table {
    table-layout: auto;
    width: 100%;
    border-collapse: collapse;
    margin: 0;
    font-family: "Avenir Next Condensed", sans-serif;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
    max-width: 600px;
  }

  input {
    font-family: "Avenir Next Condensed", sans-serif;
  }

  .key-input input {
    width: 65px;
  }

  .name-input input {
    width: 35px;
  }

  .quantity-input input {
    width: 60px;
  }

  .price-input input {
    width: 40px;
  }

  table thead th,
  table tbody tr {
    width: 50px;
  }

  table thead th:last-child,
  table tbody tr:last-child {
    width: 20px;
  }

  table thead tr {
    background-color: var(--main-color);
    color: #ffffff;
    text-align: left;
  }

  table tbody tr {
    border-bottom: 1px solid #dddddd;
  }

  table tbody tr:nth-of-type(even) {
    background-color: #f3f3f3;
  }

  table tbody tr:last-of-type {
    border-bottom: 2px solid var(--main-color);
  }

  .price-button,
  .button-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .price-button {
    width: 60px;
  }

	.add-remove-btns {
    width: 25px;
  }

  .clear-button {
    width: 50px;
  }

  button {
    transition: transform 150ms ease-out;
		font-weight: 700;
    color: white;
    background-color: var(--secondary-color);
    border: 0;
    border-radius: 3px;
    font-family: "Avenir Next Condensed", sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
  }

	button[disabled] {
		opacity: 0.5;
		touch-action: none;
		pointer-events: none;
	}

  button:hover {
    transform: scale(1.1);
  }

  button:active {
    transform: translateY(2px) scale(1.1);
  }

  @media(min-width: 500px) {
    * {
      font-size: medium;
    }

    table {
      transform: none;
      table-layout: auto;
      width: 100%;
      font-family: "Avenir Next", sans-serif;
    }
  
    input {
      font-family: "Avenir Next", sans-serif;
    }

    .key-input input  {
      width: 90px;
    }
    
    .name-input input {
      width: 90px;
    }

    .quantity-input input {
      width: 100px;
    }
    
    .price-input input {
      width: 80px;
    }
  }

  @media(min-width: 700px) {
    table th,
    table td {
      padding: 12px 15px;
    }

    .key-input input  {
      width: 110px;
    }

    .name-input input {
      width: 110px;
    }

    .quantity-input input {
      width: 100px;
    }

    .price-input input {
      width: 75px;
    }
  }
`

export function CryptoCounter() {
  const [state, send] = useMachine(cryptoCounterMachine, {
    services: {
      ['importDatabase']: async () => {
        const fullDbTable = await db.cryptos.toArray()
        return fullDbTable
      },
      ['loadPrices']: async ({ table }) => {
        const keysList = table.rows.map(({ key }) => key).join('%2C')
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${keysList}&vs_currencies=usd`
        )
        const body = await response.json()
        return body
      }
    },
    actions: {
      ['saveDatabase']: async ({ table }) => {
        const bulkPutQuery = table.rows.map(({ key, name, quantity, price }) => {
          return {
            key,
            name,
            quantity,
            price
          }
        })
        await db.cryptos.clear()
        await db.cryptos.bulkPut(bulkPutQuery)
      }
    }
  })
  const { table, newRow, fetchPricesError } = state.context
  const loading = state.matches('loadingPrices')
  const keyInputElRef = useRef()

  useEffect(() => {
    const to = setTimeout(() => {
      if(keyInputElRef.current) {
        keyInputElRef.current.focus()
      }
    }, 100)
    return () => {
      clearTimeout(to)
    }
  }, [table.rows.length])

  async function handleSaveNew(e) {
    e && e.preventDefault && e.preventDefault()
    send({ type: ADD_ROW, newRow })
  }

  return html`
    <div className=${styles}>
      <h1>CryptoCounter</h1>
      <h2>Powered by Coingecko</h2>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Name</th>
            <th>Quantity</th>
            <th>
            <div className="button-wrapper">
              <button
                className="price-button"
								onClick=${() => {
									send(FETCH_PRICES)
								}}
								disabled=${table && table.rows && table.rows.length === 0 || loading}
							>
               <div>Price</div>
               <${RefreshIconSvg} />
							</button>
            </div>
            </th>
            <th>Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          ${table &&
          table.rows &&
          table.rows.length > 0 &&
          table.rows.map(
            ({
              key,
              name,
              quantity,
              price,
              total
            }) => {
              return html`
                <tr key=${key}>
                  <td className="key-row">${key}</td>
                  <td className="name-input">
                    <${NameInput}
                      onInput=${(newName) => {
                        send({
                          type: UPDATE_ROW,
                          mutation: { key, name: newName },
                        })
                      }}
                      value=${name}
                    />
                  </td>
                  <td className="quantity-input">
                    <${QuantityInput}
                      onInput=${(newQuantity) => {
                        send({
                          type: UPDATE_ROW,
                          mutation: { key, quantity: newQuantity },
                        })
                      }}
                      value=${quantity}
                    />
                  </td>
                  <td className="price-input">
                    <${PriceInput}
                      onInput=${(newPrice) => {
                        send({
                          type: UPDATE_ROW,
                          mutation: { key, price: newPrice },
                        })
                      }}
                      value=${price}
                      disabled=${loading}
                    />
                  </td>
                  <td>$${total}</td>
                  <td>
                    <div className="button-wrapper">
                      <button
                        className="add-remove-btns"
                        onClick=${() => {
                          send({ type: DELETE_ROW, key })
                        }}
                        disabled=${loading}
                      >
                        -
                      </button>
                    </div>
                  </td>
                </tr>
              `
            }
          )}
          ${!!fetchPricesError &&
          html`
            <tr>
              <td colspan="2">${fetchPricesError}</td>
              <td colspan="1">
                <div className="button-wrapper">
                  <button
                    className="clear-button"
                    onClick=${() => {
                      send(CLEAR_ERRORS)
                    }}
                  >Clear</button>
                </div>
              </td>
              <td colspan="5" />
            </tr>
          `}
          ${table &&
          table.rows &&
          table.rows.length > 0 &&
          html`
            <tr>
              <td colspan="8" style="visibility: hidden;height: 30px;" />
            </tr>
          `}
          <tr>
            <td className="key-input">
              <${KeyInput}
                ref=${keyInputElRef}
                onSaveNew=${handleSaveNew}
                onInput=${(newKey) => {
                  send({ type: EDIT_NEW_ROW, mutation: { key: newKey } })
                }}
                value=${newRow.key}
                placeholder="Coingecko key"
                disabled=${loading}
                autoFocus
              />
            </td>
            <td className="name-input">
              <${NameInput}
                onSaveNew=${handleSaveNew}
                onInput=${(newName) => {
                  send({ type: EDIT_NEW_ROW, mutation: { name: newName } })
                }}
                value=${newRow.name}
                disabled=${loading}
              />
            </td>
            <td className="quantity-input">
              <${QuantityInput}
                className="quantity-input"
                onSaveNew=${handleSaveNew}
                onInput=${(newQuantity) => {
                  send({
                    type: EDIT_NEW_ROW,
                    mutation: { quantity: newQuantity },
                  })
                }}
                value=${newRow.quantity}
                disabled=${loading}
              />
            </td>
            <td className="price-input">
              <${PriceInput}
                onSaveNew=${handleSaveNew}
                onInput=${(newPrice) => {
                  send({
                    type: EDIT_NEW_ROW,
                    mutation: { price: newPrice },
                  })
                }}
                value=${newRow.price}
                disabled=${loading}
              />
            </td>
            <td>$${newRow.total}</td>
            <td>
              <div className="button-wrapper">
                <button
                  className="add-remove-btns"
                  onClick=${handleSaveNew}
                  disabled=${loading}
                >+</button>
              </div>
            </td>
          </tr>
          ${!!newRow.error &&
          html`
            <tr>
              <td colspan="2">${newRow.error}</td>
              <td colspan="1">
                <div className="button-wrapper">
                  <button
                    className="clear-button"
                    onClick=${() => {
                      send(CLEAR_ERRORS)
                    }}
                  >Clear</button>
                </div>
              </td>
              <td colspan="5" />
            </tr>
          `}
          <tr>
            <td colSpan="4"></td>
            <td>$${toUSD(Number(table.finalTotal) + Number(newRow.total))}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  `
}
