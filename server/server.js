const path = require('path')
const ejs = require('ejs')
const fastifyStatic = require('fastify-static')
const { getFileContents } = require('../node-utils')

let STATIC_FILE_PATH
if(process.env.ENV === 'development') {
	STATIC_FILE_PATH = path.join(__dirname, '../static')
} else if(process.env.ENV === 'production') {
	STATIC_FILE_PATH = path.join(__dirname, '../dist')
} else {
	throw new Error('You messed with the process.env.ENV. Expecting it to be \'development\' or \'production\'')
}

const fastify = require('fastify')({
	logger: true
})

fastify.register(fastifyStatic, {
	root: STATIC_FILE_PATH
})

;['/', '/index.html'].forEach((url) => {
	fastify.get(url, async(_, reply) => {
		const indexTemplate = await getFileContents(path.resolve(__dirname, '../templates/index-template.ejs'))
		const responseBody = ejs.render(indexTemplate, { env: process.env.ENV })
		reply.headers({
			'Content-Type': 'text/html; charset=utf-8'
		})
		reply.send(responseBody)
	})
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
