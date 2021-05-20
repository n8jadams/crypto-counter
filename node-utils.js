const fs = require('fs').promises
const UglifyJS = require('uglify-js')

async function getFileContents(filePath, encoding = 'utf8') {
	try {
		return await fs.readFile(filePath, encoding)
	} catch(err) {
		console.log(err)
		throw new Error(err)
	}
}

async function readGlobsFromFile(filename) {
	if(!fs.exists(filename)) {
		return []
	}
	const list = await fs.readFile(filename, 'utf-8')
	return list
		.split('\n')
		.map(f => f.trim())
		.filter(Boolean)
}

function minifyJs(fullJsCode) {
	const minifiedCode = UglifyJS.minify(fullJsCode).code.split('<').map(p => p.trim()).join('<').split('>').map(p => p.trim()).join('>').replace(/\s+/gm, ' ').replace(/\n/, ' ')
	return minifiedCode
}

module.exports = {
	getFileContents,
	readGlobsFromFile,
	minifyJs
}