const Q = require("../src/queries/index");
const db = require("../src/database");
const { getUserByEmail } = require('./dbops/helpers');
const { initDb, loadFirstAnswersAndPublish, upgradeTestSuite, 
    assignAnswerSets, loadSecondAnswers, login, errmgr: loadDataErrors } = require('./load-data');
const {expect} = require('chai');
const winston = require('winston');
const testBookActions = require('../src/actions/testBooks');

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
            users: "./data/users-multiple.json"
        };
        jwt = await initDb(dataProfile); 
        await assignAnswerSets(jwt);
    });
  
    describe("create and retrieve assignments", function() {
        it("assigned some answer sets to each user", async function() {
            let dbres = await db.query(Q.USERS.GET_ALL_EXTENDED, {}, jwt);
            let users = dbres.data.users.filter(u => u.login.type == "USER");
            for (user of users) {
                dbres = await db.query(Q.ANSWER_SETS.GET_FOR_USER, {userId: user.id}, jwt);
                expect(dbres.data.answerSets.length).to.be.greaterThan(0);
            }
        });    
    });

    describe("login as a user and see only their assignments", function () {
        before(async function() {
            userJwt = await login("sara@example.com", "password");
        });
        it("can get testing environments with only the user's own answer sets", async function() {
            let user = await getUserByEmail("sara@example.com", jwt);
            dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_BY_USER, {userId: user.id}, userJwt);
            expect(dbres.data.getUserTestingEnvironments.length).to.be.greaterThan(0);
            for (testingEnvironment of dbres.data.getUserTestingEnvironments) {
                for (answerSet of testingEnvironment.answerSets) {
                    expect(answerSet.user.id).to.equal(user.id);
                }
            }
        });
    }); 
});