# CryptoCounter
A PWA that helps you track your cryptocurrency portfolio with the help of the Coingecko API.

NOTE: This is just a fun little side project to help me learn how to write buildless preact sites, IndexedDB, and some of the nuances of iOS Safari and PWAs.

## Requirements
1. Node
2. `ngrok` or some other way to pipe a localhost port to the WWW
3. A phone

## Setup
1. Run the install script which is also the build script. We're manually using preact with xstate, so ignore react resolving errors.
```bash
$ npm install
```
2. Start the script
```bash
$ npm run prod # or npm run dev for development
```
3. In a different terminal, pipe port 8081 to `ngrok` or something else
```bash
$ ngrok http 8081
```
4. Grab the public https url of the site and download like you would any other PWA.
	* On iOS: Open the page, expand the options, and click "Add to Home Screen". Open and close the newly added app a couple times on your phone.
	* On Android: ??
5. You can kill all of the scripts, everything is in place for the app to work offline.

## Todos
- [x] Separate development from prod
- [ ] Sort table by market cap or by price
- [ ] Add Android install instructions to the README
- [ ] Better design
