import { initDb, errmgr as loadDataErrors } from './load-data.js';
import chai from 'chai';
const expect = chai.expect;
import winston from 'winston';

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
        try {
            jwt = await initDb(dataProfile); 
        }
        catch (err) {
            loadDataErrors.addError(err);
        }
    });
  
    describe('initial-data-import', function() {
        it('reports errors', async function() {
            let errors = loadDataErrors.getErrors();
            for (let err of errors) {
                winston.error(err.toString());
            }
            expect(errors.length).not.to.equal(0);
            
        }); 
    });
});

