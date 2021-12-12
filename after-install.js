const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { minifyJs } = require('./node-utils')
const normalize = require('normalize-path')

function copyDirectorySync(source, destination) {
  fs.mkdirSync(destination, { recursive: true })
    
  fs.readdirSync(source, { withFileTypes: true }).forEach((entry) => {
    let sourcePath = path.join(source, entry.name)
    let destinationPath = path.join(destination, entry.name)

    entry.isDirectory()
      ? copyDirectorySync(sourcePath, destinationPath)
      : fs.copyFileSync(sourcePath, destinationPath)
  })
}

try {
  // Run the snowpack bundler
  const snowpackCmd = `node ${normalize(path.resolve(__dirname, 'node_modules/snowpack/dist-node/index.bin.js'))}`
  spawnSync(
    snowpackCmd.split(' ')[0],
    snowpackCmd.split(' ').slice(1),
    { stdio: 'inherit', shell: true, cwd: __dirname }
  )

  // Move web_modules into the static dir
  copyDirectorySync(path.resolve(__dirname, 'web_modules'), path.resolve(__dirname, 'static', 'web_modules'))

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
} catch(err) {
  throw new Error(err)
}
