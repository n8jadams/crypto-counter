import Dexie from '../web_modules/dexie.js'

class CryptoDb extends Dexie {
	constructor() {
			super('cryptos');
			this.version(2).stores({
					cryptos: `
						++id,
						&key,
						name,
						quantity,
						price
			`});
	}
}

export const db = new CryptoDb()