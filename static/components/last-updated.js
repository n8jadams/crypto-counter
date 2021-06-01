import formatDistance from '../web_modules/date-fns/formatDistance.js'
import { html } from '../web_modules/htm/preact.js'
import { useState, useEffect } from '../web_modules/preact/compat.js'
import css from '../web_modules/csz.js'

const style = css`
	span {
		font-style: italic;
		color: #737373;
		margin-right: 10px;
	}
`

function getDisplayText(date) {
	const result = formatDistance(
		date,
		new Date(),
		{
			includeSeconds: true,
			addSuffix: true
		}
	)
	return result
}

export function LastUpdated({ date }) {
	const [displayText, setDisplayText] = useState(getDisplayText(date))

	useEffect(() => {
		setDisplayText(getDisplayText(date))
		const interval = setInterval(() => {
			const newDisplayText = getDisplayText(date)
			if(newDisplayText !== displayText) {
				setDisplayText(newDisplayText)
			}
		}, 5000)

		return () => {
			clearInterval(interval)
		}
	}, [date])

	return html`
		<div className=${style}>
			<span>(Last checked ${displayText})</span>
		</div>
	`
}