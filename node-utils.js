const fs = require('fs').promises

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

module.exports = {
	getFileContents,
	readGlobsFromFile,
}