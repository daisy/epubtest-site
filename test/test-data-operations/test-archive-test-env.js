import * as Q from '../../src/queries/index.js';
import * as db from "../../src/database/index.js";

import { initDb, loadFirstAnswersAndPublish, 
    assignAnswerSets, errmgr as loadDataErrors } from './load-data.js';
import chai from 'chai';
const expect = chai.expect;
import winston from 'winston';

let jwt;
let testenvId; 

describe('archive-testing-environment', function () {
    this.timeout(5000);
    before(async function () {
        winston.add(new winston.transports.Console({format: winston.format.simple()}));
        winston.level = 'debug';
        let dataProfile = {
            langs: "./data/langs.json",
            topics: "./data/topics.json",
            testBooks: "./data/test-books.json",
            software: "./data/software.json",
            testingEnvironments: "./data/testing-environments.json",
            users: "./data/users.json"
        };
        jwt = await initDb(dataProfile); 

        await assignAnswerSets(jwt);
        dataProfile = {
            answers: "./data/answers-first-set.json"
        };
        await loadFirstAnswersAndPublish(jwt, dataProfile);
    });
    
    describe('set as archived', function () {
        before(async function() {
            // archive the first published one
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED(), {}, jwt);
            let testenv = dbres.data.testingEnvironments[0];
            testenvId = testenv.id; // save the ID for later
            dbres = await db.query(
                Q.TESTING_ENVIRONMENTS.UPDATE(),  { 
                    id: testenvId,
                    patch: {isArchived: true}
                },
                jwt);
        });
        it("archived the testing environment", async function() {
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET(), {
                id: testenvId
            }, jwt);
            expect(dbres.data.testingEnvironment.isArchived).to.be.true;
        });
        it("does not include the testing environment in the public results", async function() {
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED(), {}, jwt);
            let ids = dbres.data.testingEnvironments.map(tenv => tenv.id);
            expect(ids.includes(testenvId)).to.be.false;
        });
    });

    describe('unarchive testing environment', function () {
        before(async function() {
            // unarchive the one we archived in the last step
            let dbres = await db.query(
                Q.TESTING_ENVIRONMENTS.UPDATE(),  { 
                    id: testenvId,
                    patch: {isArchived: false}
                },
                jwt);
        });
        it("unarchived the testing environment", async function() {
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET(), {
                id: testenvId
            }, jwt);
            expect(dbres.data.testingEnvironment.isArchived).to.be.false;
        });
        it("includes the testing environment in the public results list", async function() {
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED(), {}, jwt);
            let ids = dbres.data.testingEnvironments.map(tenv => tenv.id);
            expect(ids.includes(testenvId)).to.be.true;  
        });
    });

});

