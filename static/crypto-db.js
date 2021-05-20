import { openDB } from './web_modules/idb.js'

const DB_NAME = 'crypto-counter'
const DB_VERSION = 1
const DB_STORE_NAME = 'cryptos'

const dbPromise = openDB(DB_NAME, DB_VERSION, {
	upgrade(db) {
		if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
			const store = db.createObjectStore(DB_STORE_NAME, { keyPath: 'key' })
			store.createIndex('marketcap', 'marketcap', { unique: false })
			store.createIndex('symbol', 'symbol', { unique: false })
			store.createIndex('quantity', 'quantity', { unique: false })
			store.createIndex('price', 'price', { unique: false })
		}
	}
})

export const db = {
	getAll: async () => {
		return (await dbPromise).getAll(DB_STORE_NAME)
	},
	bulkPut: async (rows) => {
		return await dbPromise.then(db => {
			const tx = db.transaction(DB_STORE_NAME, 'readwrite')
			const store = tx.objectStore(DB_STORE_NAME)
			for(const row of rows) {
				store.put(row)
			}
		})
	},
	clear: async () => {
		const rows = await db.getAll()
		for(const row of rows) {
			(await dbPromise).delete(DB_STORE_NAME, row.key)
		}
	}
}
