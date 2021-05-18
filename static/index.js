import { html, render } from './web_modules/htm/preact.js'
import { CryptoCounter } from './crypto-counter.js'

render(
	html`
		<${CryptoCounter} />
	`,
	document.body
)