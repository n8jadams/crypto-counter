import { html } from '../web_modules/htm/preact.js'
import { forwardRef } from '../web_modules/preact/compat.js'
import css from '../web_modules/csz.js'

const styles = css`
	input {
		text-transform: lowercase;
	}
`

export const KeyInput = forwardRef(({ onSaveNew, onInput, value, placeholder, disabled, autoFocus }, ref) => {
	if(!onSaveNew) {
		onSaveNew = (e) => { e.preventDefault() }
	}

	return html`
		<form onSubmit=${onSaveNew} className=${styles}>
			<input
				type="text"
				ref=${ref}
				autocapitalize="off"
				onKeyPress=${(e) => {
					if(!e.key.match(/([a-zA-Z0-9]|-|_)/)) {
						e.preventDefault()
					}
				}}
				onInput=${(e) => {
					onInput(e.target.value)
				}}
				value=${value}
				placeholder=${placeholder}
				disabled=${disabled}
				autoFocus=${!!autoFocus}
			/>
		</form>
	`
})