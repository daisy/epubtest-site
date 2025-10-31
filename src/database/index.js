import * as path from 'path';
import { makeQueryRunner } from './queryRunner.js';
import { options } from './postgraphileOptions.js';
import makeCache from './makeCache.js';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DBURL = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}`;
let queryRunner;

// make the postgraphile cache and setup a query runner
async function initDatabaseConnection() {
    await makeCache(DBURL);
    //console.log(DBURL);    
    queryRunner = await makeQueryRunner(
        DBURL,
        process.env.DB_SCHEMAS,
        {
            ...options,
            readCache: `${__dirname}/postgraphile.cache`
        }
    );
}

async function query(graphqlQuery, variables = {}, jwtToken = null) {
    let response = await queryRunner.query(
        graphqlQuery,
        variables,
        jwtToken);
    if (response.hasOwnProperty("errors")) {
        return {
            data: null,
            success: false,
            message: "Database request contains errors",
            errors: response.errors
        }
    }
    else {
        return {
            data: JSON.parse(JSON.stringify(response.data)), // graphql purposefully does not return a true Object so this adaptation is required
            success: true,
            message: '',
            errors: []
        };
    }
}

export { initDatabaseConnection, query, DBURL };
