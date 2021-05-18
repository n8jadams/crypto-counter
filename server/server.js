const path = require('path')
const ejs = require('ejs')
const fs = require('fs')
const fg = require('fast-glob')
const UglifyJS = require('uglify-js')
const fastifyStatic = require('fastify-static')
const CleanCSS = require('clean-css')

const STATIC_FILE_PATH = path.join(__dirname, '../static')

const fastify = require('fastify')({
	logger: true
})

async function getFileContents(filePath, encoding = 'utf8') {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, encoding, (err, data) => {
			if (err) {
				reject(err)
			}
			resolve(data)
		})
	})
}

function readGlobsFromFile(filename) {
	if (!fs.existsSync(filename)) {
		return []
	}
	return fs
		.readFileSync(filename, 'utf-8')
		.split('\n')
		.map(f => f.trim())
		.filter(Boolean)
}

fastify.register(fastifyStatic, {
	root: path.join(__dirname, '../static')
})

;['/', '/index.html'].forEach((url) => {
	fastify.get(url, async(_, reply) => {
		const indexTemplate = await getFileContents(path.resolve(__dirname, 'index-template.ejs'))
		const responseBody = ejs.render(indexTemplate, { env: process.env.ENV })
		reply.headers({
			'Content-Type': 'text/html; charset=utf-8'
		})
		reply.send(responseBody)
	})
})

fastify.get('/service-worker.js', async (_, reply) => {
	const serviceWorkerTemplate = path.resolve(__dirname, 'service-worker-template.ejs')
	const template = await getFileContents(serviceWorkerTemplate)
	try {
		const fullStaticFiles = await fg([`${STATIC_FILE_PATH}/**/**.*`], { dot: false, ignore: readGlobsFromFile('./.gitignore') })
		const staticFiles = fullStaticFiles.map((file) => file.replace(STATIC_FILE_PATH, ''))
		const serviceWorker = ejs.render(template, {
			cacheName: 'v1',
			staticFiles
		})
		reply.headers({
			'Content-Type': 'text/javascript; charset=utf-8'
		})
		reply.send(serviceWorker)
	} catch (e) {
		console.log(e)
		throw new Error(e)
	}
})

fastify.addHook('onSend', async (req, reply, payload) => {
	if(process.env.ENV === 'production' && ['.js', '.css'].some(ext => req.url.endsWith(ext))) {
		let newPayload = await getFileContents(path.resolve(__dirname, '../static', `.${req.url}`))
		if(req.url.endsWith('.js')) {
			newPayload = UglifyJS.minify(newPayload).code
		}
		if(req.url.endsWith('.css')) {
			const { styles } = await new CleanCSS({ returnPromise: true }).minify(newPayload)
			newPayload = styles
		}
		reply.headers({
			'content-length': newPayload.length
		})
		return newPayload
	}
	return payload
})

const start = async () => {
	try {
		await fastify.listen(8081)
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}
void start()
