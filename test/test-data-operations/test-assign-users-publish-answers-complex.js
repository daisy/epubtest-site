import * as Q from '../../src/queries/index.js';
import * as db from "../../src/database/index.js";
import * as helpers from './dbops/helpers.js';

import { initDb, assignAnswerSets, login, errmgr as loadDataErrors } from './load-data.js';
import chai from 'chai';
const expect = chai.expect;
import winston from 'winston';

let jwt;
let userJwt;

describe('assign-users-publish-answers-complex', function () {
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
    });
  
    describe("create and retrieve assignments", function() {
        it("assigned some answer sets to each user", async function() {
            let dbres = await db.query(Q.USERS.GET_ALL_EXTENDED(), {}, jwt);
            let users = dbres.data.users.filter(u => u.login.type == "USER");
            for (let user of users) {
                dbres = await db.query(Q.ANSWER_SETS.GET_FOR_USER(), {userId: user.id}, jwt);
                expect(dbres.data.answerSets.length).to.be.greaterThan(0);
            }
        });    
    });

    describe("login as a user and see only their assignments", function () {
        before(async function() {
            userJwt = await login("sara@example.com", "password");
        });
        it("can get testing environments with only the user's own answer sets", async function() {
            let user = await helpers.getUserByEmail("sara@example.com", jwt);
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_BY_USER(), {userId: user.id}, userJwt);
            expect(dbres.data.getUserTestingEnvironments.length).to.be.greaterThan(0);
            for (let testingEnvironment of dbres.data.getUserTestingEnvironments) {
                for (let answerSet of testingEnvironment.answerSets) {
                    expect(answerSet.user.id).to.equal(user.id);
                }
            }
        });
    }); 
});