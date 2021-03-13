import * as Q from '../../src/queries/index.js';
import * as db from "../../src/database/index.js";
import * as testBookActions from '../../src/actions/testBooks.js';

import { initDb, errmgr as loadDataErrors } from './load-data.js';
import chai from 'chai';
const expect = chai.expect;
import winston from 'winston';


let jwt;

describe('initial-data-import', function () {
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
    });
    // it('does not report errors', async function() {
    //     expect(loadDataErrors.getErrors().length).to.equal(0);
    // });
    it('has two users', async function () {
        let dbres = await db.query(Q.USERS.GET_ALL(),  {}, jwt);
        expect(dbres.data.users.length).to.equal(2);
    });
    it('has two testing environments', async function() {
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL(),  {}, jwt);
            expect(dbres.data.testingEnvironments.length).to.equal(2);
    });
    it('has two test books', async function() {
        let dbres = await db.query(Q.TEST_BOOKS.GET_ALL(),  {}, jwt);
        expect(dbres.data.testBooks.length).to.equal(2);
    });
    it('has three tests per test book', async function() {
        let dbres = await db.query(Q.TEST_BOOKS_WITH_TESTS.GET_ALL(),  {}, jwt);
        let testBooks = dbres.data.testBooks;
        for (let testBook of testBooks) {
            expect(testBook.tests.length).to.equal(3);
        }
    });
    it('has two answer sets per testing environment', async function () {
        let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL(),  {}, jwt);
        let testingEnvironments = dbres.data.testingEnvironments;
        for (let testingEnvironment of testingEnvironments) {
            expect(testingEnvironment.answerSets.length).to.equal(2);
        }
    });
    it('has two answer sets per test book', async function() {
        let dbres = await db.query(Q.TEST_BOOKS.GET_ALL(),  {}, jwt);
        let testBooks = dbres.data.testBooks;
        for (let testBook of testBooks) {
            dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK(), {testBookId: testBook.id}, jwt);
            expect(dbres.data.answerSets.length).to.equal(2);
        }
    });
    it('has three answers per answer set', async function() {
        let dbres = await db.query(Q.ANSWER_SETS.GET_ALL(),  {}, jwt);
        let answerSets = dbres.data.answerSets;
        for (let answerSet of answerSets) {
            expect(answerSet.answers.length).to.equal(3);
        }
    });
    it('has NOANSWER for every answer value', async function() {
        let dbres = await db.query(Q.ANSWERS.GET_ALL(),  {}, jwt);
        let answers = dbres.data.answers;
        for (let answer of answers) {
            expect(answer.value).to.equal('NOANSWER');
        }
    });
    it('has no user assigned to any answer sets', async function() {
        let dbres = await db.query(Q.ANSWER_SETS.GET_ALL(),  {}, jwt);
        let answerSets = dbres.data.answerSets;
        for (let answerSet of answerSets) {
            expect(answerSet.user).to.be.null;
        }
    });
    it("has no public answer sets", async function() {
        let dbres = await db.query(Q.ANSWER_SETS.GET_ALL(),  {}, jwt);
        let answerSets = dbres.data.answerSets;
        for (let answerSet of answerSets) {
            expect(answerSet.isPublic).to.be.false;
        }
    });
    it("has a score of zero for every answer set", async function () {
        let dbres = await db.query(Q.ANSWER_SETS.GET_ALL(),  {}, jwt);
        let answerSets = dbres.data.answerSets;
        for (let answerSet of answerSets) {
            expect(parseFloat(answerSet.score)).to.equal(0.0);
        }
    });
    it("has one OS", async function() {
        let dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('Os'), {}, jwt);
        expect(dbres.data.softwares.length).to.equal(1);
    });
    it("has two ATs", async function() {
        let dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('AssistiveTechnology'), {}, jwt);
        expect(dbres.data.softwares.length).to.equal(2);
    });
    it("has two RSes", async function() {
        let dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('ReadingSystem'), {}, jwt);
        expect(dbres.data.softwares.length).to.equal(2);
    });
    it("reports the correct usage ", async function() {
        let dbres = await db.query(Q.TEST_BOOKS.GET_ALL(),  {});
        let id = dbres.data.testBooks[0].id; // just grab the first test book
        let result = await testBookActions.getUsage(id, jwt);
        expect(result.answerSets.nonEmpty.length).to.equal(0);
        expect(result.answerSets.empty.length).to.equal(2);
        expect(result.answerSets.all.length).to.equal(2);
    });
});

