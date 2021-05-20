import { html } from '../web_modules/htm/preact.js'
import css from '../web_modules/csz.js'

const styles = css`
	input {
		text-transform: uppercase;
	}
`

export function SymbolInput({ onSaveNew, onInput, value, disabled }) {
	if(!onSaveNew) {
		onSaveNew = (e) => { e.preventDefault() }
	}

	return html`
		<form onSubmit=${onSaveNew} className=${styles}>
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