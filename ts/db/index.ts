const { Pool } = require('pg');

const env = process.env.NODE_ENV;
// console.log('env ', env);
const localSSL = false;
const deployedSSL = {
	rejectUnauthorized: false
}

// TODO: Double check this connection on Heroku on next push
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: env === 'local-dev' ? localSSL : deployedSSL
});

const query = async (text: any, params: any) => {
	const start = Date.now();
	const data = await pool.query(text, params);
	const duration = Date.now() - start;
	// console.log('*** Executed Query: ', { text, duration: duration + " ms", rows: data.rowCount, params });
	return data;
}

module.exports = { query };