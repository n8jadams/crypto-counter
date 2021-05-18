const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

// Run the snowpack bundler
const snowpackCmd = `node node_modules/snowpack/dist-node/index.bin.js`
spawnSync(
	snowpackCmd.split(' ')[0],
	snowpackCmd.split(' ').slice(1),
	{ stdio: 'inherit', shell: true, cwd: __dirname }
)

// Move web_modules into the static dir
fs.renameSync(path.resolve(__dirname, 'web_modules'), path.resolve(__dirname, 'static/web_modules'))

// Manually modify @xstate/react imports to use preact instead
const xstateReactFilePath = path.resolve(__dirname, 'static/web_modules/@xstate/react.js')
let xstateReactFile = fs.readFileSync(xstateReactFilePath, 'utf8')
xstateReactFile = xstateReactFile.replace(`import * as React from 'react';
import { useLayoutEffect, useRef, useEffect, useState, useCallback } from 'react';`, 'import { useLayoutEffect, useRef, useEffect, useState, useCallback } from \'../preact/hooks.js\';')
xstateReactFile = xstateReactFile.replace('React.useRef()', 'useRef()')
fs.writeFileSync(xstateReactFilePath, xstateReactFile, 'utf8')
