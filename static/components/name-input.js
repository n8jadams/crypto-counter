import { html } from '../web_modules/htm/preact.js'

export function NameInput({ onSaveNew, onInput, value, disabled }) {
	if(!onSaveNew) {
		onSaveNew = (e) => { e.preventDefault() }
	}

	return html`
		<form onSubmit=${onSaveNew}>
			<input
				type="text"
				autocapitalize="characters"
				onInput=${(e) => {
					onInput(e.target.value)
				}}
				value=${value}
				placeholder="Name"
				disabled=${disabled}
			/>
		</form>
	`
}