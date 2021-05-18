import { html } from '../web_modules/htm/preact.js'
import { useRef, useEffect } from '../web_modules/preact/hooks.js'

export function PriceInput({ onSaveNew, onInput, value, disabled }) {
	const inputElRef = useRef()
	const caretRef = useRef()

	// Some cursor management for the odd cases
	useEffect(() => {
		if(caretRef.current > 1) {
			window.requestAnimationFrame(() => {
				inputElRef.current.selectionStart = caretRef.current
				inputElRef.current.selectionEnd = caretRef.current
			})
		}
	}, [value])

	if(!onSaveNew) {
		onSaveNew = (e) => { e.preventDefault() }
	}

  return html`
    <form onSubmit=${onSaveNew}>
      <input
        ref=${inputElRef}
        type="text"
        inputMode="decimal"
        onKeyPress=${disabled ? undefined : (e) => {
          if (e.key !== 'Enter') {
            const isNonNumeric = !e.key.match(/[0-9]/)
            const isDot = e.key === '.'
            const alreadyHasADot = String(value).includes('.')
            const [_, afterDecimal] = String(value).split('.')
            if (
              (isNonNumeric && e.key !== '.') ||
              (alreadyHasADot && isDot) ||
              (value === 0 && e.key === '0') ||
              afterDecimal.length === 2
            ) {
              e.preventDefault()
              return
            }
            if (Number(value) < 1 && isDot) {
              e.preventDefault()
							onInput('0.')
              return
            }
          }
        }}
        onInput=${disabled ? undefined : (e) => {
					caretRef.current = e.target.selectionStart
          let newValue = e.target.value
					const hasDecimalAndTrailingZero = String(value).includes('.') && newValue.endsWith('0')
          if (newValue === '') {
            newValue = 0
          } else if (!hasDecimalAndTrailingZero && !newValue.endsWith('.')) {
            // Prevent prepended zeros before actual digits
            newValue = String(Number(e.target.value))
          }
					onInput(newValue)
        }}
        value=${value}
        disabled=${disabled}
      />
    </form>
  `
}
