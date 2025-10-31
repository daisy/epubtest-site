import postgraphile from 'postgraphile';
import * as path from 'path';
import { options } from './postgraphileOptions.js';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function makeCache(dbUrl) {
    const pgPool = new Pool({
        connectionString: dbUrl,
    });
    const schemas = process.env.DB_SCHEMAS
    ? process.env.DB_SCHEMAS.split(',')
    : ['app_public'];
  
    await postgraphile.createPostGraphileSchema(pgPool, schemas, {
        ...options,
        writeCache: `${__dirname}/postgraphile.cache`,
    });
    await pgPool.end();
}

export default makeCache;