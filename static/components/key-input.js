import { html } from '../web_modules/htm/preact.js'
import { forwardRef } from '../web_modules/preact/compat.js'

export const KeyInput = forwardRef(({ onSaveNew, onInput, value, placeholder, disabled, autoFocus }, ref) => {
	if(!onSaveNew) {
		onSaveNew = (e) => { e.preventDefault() }
	}

	return html`
		<form onSubmit=${onSaveNew}>
			<input
				type="text"
				ref=${ref}
				autocapitalize="off"
				onKeyPress=${(e) => {
					if(!e.key.match(/([a-z0-9]|-|_)/)) {
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