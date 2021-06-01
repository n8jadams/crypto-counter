export async function downloadObjectAsJSONFile(object, filename) {
	if(!filename.endsWith('.json')) {
		filename = `${filename}.json`
	}
	const json = JSON.stringify(object)
	const blob = new Blob([json],{ type:'application/json' })
	const href = await URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = href
	link.download = filename
	link.position = 'absolute'
	link.left = '200vw'
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
}