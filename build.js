const fs = require('fs').promises
const path = require('path')
const fg = require('fast-glob')
const UglifyJS = require('uglify-js')
const CleanCSS = require('clean-css')
const ejs = require('ejs')

const { getFileContents } = require('./node-utils.js')

const STATIC_FILE_PATH = path.resolve(__dirname, 'static')
const DIST_FILE_PATH = path.resolve(__dirname, 'dist')

;(async () => {
  try {
    await fs.rmdir(DIST_FILE_PATH, { recursive: true })

    console.log('Minifying and copying js files...')
    const jsFiles = await fg([`${STATIC_FILE_PATH}/**/**.js`])
    await Promise.all(
      jsFiles.map(async (file) => {
        try {
          const directory = path
            .dirname(file)
            .replace(STATIC_FILE_PATH, DIST_FILE_PATH)
          await fs.mkdir(directory, { recursive: true })
          const contents = await getFileContents(file)
          const minifiedJs = UglifyJS.minify(contents).code
          await fs.writeFile(
            file.replace(STATIC_FILE_PATH, DIST_FILE_PATH),
            minifiedJs,
            'utf-8'
          )
        } catch (jsCopyError) {
          console.log(jsCopyError)
          throw new Error(jsCopyError)
        }
      })
    )

		console.log('Minifying and copying css files...')
    const cssFiles = await fg([`${STATIC_FILE_PATH}/**/**.css`])
    await Promise.all(
      cssFiles.map(async (file) => {
        try {
          const directory = path
            .dirname(file)
            .replace(STATIC_FILE_PATH, DIST_FILE_PATH)
          await fs.mkdir(directory, { recursive: true })
          const { styles } = await new CleanCSS({ returnPromise: true }).minify(
            await getFileContents(file)
          )
          await fs.writeFile(
            file.replace(STATIC_FILE_PATH, DIST_FILE_PATH),
            styles,
            'utf-8'
          )
        } catch (cssCopyError) {
          console.log(cssCopyError)
          throw new Error(cssCopyError)
        }
      })
    )

    console.log('Copying the rest of the files...')
    const restOfFiles = await fg([`${STATIC_FILE_PATH}/**/*.!(js|css)`])
    await Promise.all(
      restOfFiles.map(async (file) => {
        try {
          const dirname = path.dirname(file)
          await fs.mkdir(dirname.replace(STATIC_FILE_PATH, DIST_FILE_PATH), {
            recursive: true,
          })
          await fs.copyFile(
            file,
            file.replace(STATIC_FILE_PATH, DIST_FILE_PATH)
          )
        } catch (otherCopyError) {
          console.log(otherCopyError)
          throw new Error(otherCopyError)
        }
      })
    )

		console.log('Compiling and building the service worker file...')
		const fullStaticFiles = await fg([`${DIST_FILE_PATH}/**/**.*`])
		const staticFiles = fullStaticFiles.map((file) => file.replace(DIST_FILE_PATH, ''))
		const serviceWorkerTemplate = await getFileContents(path.resolve(__dirname, 'templates/service-worker-template.ejs'))
		const serviceWorkerCode = ejs.render(serviceWorkerTemplate, {
			cacheName: 'v1',
			staticFiles
		})
		const minifiedWorkerCode = UglifyJS.minify(serviceWorkerCode).code
		await fs.writeFile(path.resolve(DIST_FILE_PATH, 'service-worker.js'), minifiedWorkerCode)

		console.log('Done building!')
  } catch (error) {
    console.log(error)
		throw new Error(error)
  }
})()
