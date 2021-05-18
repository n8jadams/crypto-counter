export function toUSD(num) {
	const regex = new RegExp('^-?\\d+(?:\.\\d{0,2})?')
	const formattedNumber = num.toString().match(regex)[0]
	if(formattedNumber === '0') {
		return '0.00'
	}
	const [beforeDecimal, afterDecimal] = formattedNumber.split('.')
	if(afterDecimal && afterDecimal.length === 1) {
		return `${beforeDecimal}.${afterDecimal}0`
	}
	return formattedNumber
}