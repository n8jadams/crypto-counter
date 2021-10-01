const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { minifyJs } = require('./node-utils')

// Run the snowpack bundler
const snowpackCmd = `node node_modules/snowpack/dist-node/index.bin.js`
spawnSync(
	snowpackCmd.split(' ')[0],
	snowpackCmd.split(' ').slice(1),
	{ stdio: 'inherit', shell: true, cwd: __dirname }
)

// Move web_modules into the static dir
fs.renameSync(path.resolve(__dirname, 'web_modules'), path.resolve(__dirname, 'static/web_modules'))

// Replace react file with bare minimum preact exports
const bundledReactFilePath = path.resolve(__dirname, 'static', 'web_modules', 'react.js')
const shimmedReact = minifyJs(`
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from './preact/hooks.js'

export {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
}
`)
fs.writeFileSync(bundledReactFilePath, shimmedReact, 'utf8')
