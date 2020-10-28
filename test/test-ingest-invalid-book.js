const Q = require("../src/queries/index");
const db = require("../src/database");
const { initDb, errmgr: loadDataErrors } = require('./load-data');
const {expect} = require('chai');
const winston = require('winston');

let jwt;

describe('ingest-invalid-book', function () {
    this.timeout(5000);
    before(async function () {
        winston.add(new winston.transports.Console({format: winston.format.simple()}));
        winston.level = 'debug';
        let dataProfile = {
            langs: "./data/langs.json",
            topics: "./data/topics.json",
            testBooks: "./data/test-books-invalid-version.json",
            software: "./data/software.json",
            testingEnvironments: "./data/testing-environments.json",
            users: "./data/users.json"
        };
        jwt = await initDb(dataProfile); 
    });
  
    describe('initial-data-import', function() {
        it('reports errors', async function() {
            let errors = loadDataErrors.getErrors();
            expect(errors.length).not.to.equal(0);
            for (err of errors) {
                winston.error(err.toString());
            }
        }); 
    });
});

