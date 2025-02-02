import * as Q from '../../src/queries/index.js';
import * as db from "../../src/database/index.js";
import * as testBookActions from '../../src/actions/testBooks.js';

import { initDb, loadFirstAnswersAndPublish, upgradeTestSuite, 
    assignAnswerSets, loadSecondAnswers, errmgr as loadDataErrors } from './load-data.js';
import chai from 'chai';
const expect = chai.expect;
import winston from 'winston';

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

let jwt;

let comparisonAnswer;
let comparisonAnswerSet;

describe('upgrade-test-books', function () {
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

        // stash the first basic func answer set and test
        let result = await testBookActions.getLatestForTopicWithTests("basic-functionality");
        let basicFuncBook = result.testBook;
        let dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK(), { testBookId: basicFuncBook.id}, jwt);
        comparisonAnswerSet = dbres.data.answerSets[0];
        comparisonAnswer = comparisonAnswerSet.answers.find(a => a.test.testId == "file-110");
        
    });
    
    describe('upgrade test suite', function () {
        before(async function() {
            let dataProfile = {
                upgrade: "./data/upgrade-test-books.json"
            };
            await upgradeTestSuite(jwt, dataProfile);
            // deliberately wait so we have a good difference in timestamps
            await waitFor(2000);
        });
        it("has four test books", async function() {
            let dbres = await db.query(Q.TEST_BOOKS.GET_ALL(),  {}, jwt);
            expect(dbres.data.testBooks.length).to.equal(4);
        });
        it("marks the new books as the latest for their topics", async function() {
            let result = await testBookActions.getLatestForTopic("basic-functionality");
            let basicFuncBook = result.testBook;
            result = await testBookActions.getLatestForTopic("non-visual-reading");
            let nonVisBook = result.testBook;
            expect(basicFuncBook.version).to.equal("1.1.0");
            expect(nonVisBook.version).to.equal("1.0.1");
        });
        it("has 3 tests per book", async function() {
            let dbres = await db.query(Q.TEST_BOOKS.GET_LATEST(), {}, jwt);
            let testBooks = dbres.data.getLatestTestBooks;
            for (let tb of testBooks) {
                dbres = await db.query(Q.TEST_BOOKS_WITH_TESTS.GET(), { id: tb.id });
                let testBook = dbres.data.testBook;
                expect(testBook.tests.length).to.equal(3);
            }
        });
        it("does not have test file-210", async function() {
            let result = await testBookActions.getLatestForTopicWithTests("basic-functionality");
            let basicFuncBook = result.testBook;
            
            expect(basicFuncBook.tests["file-210"]).to.be.undefined;
        });
        it("flagged the tests correctly", async function() {
            let result = await testBookActions.getLatestForTopicWithTests("basic-functionality");
            let basicFuncBook = result.testBook;
            
            for (let test of basicFuncBook.tests) {
                if (test.testId == "file-010") {
                    expect(test.flag).to.be.true;
                }
                else if (test.testId == "file-110") {
                    expect(test.flag).to.be.false;
                }
                else if (test.testId == "file-310") {
                    expect(test.flag).to.be.true;
                }
            }
        });
        // a flag on an answer set means that it requires attention from the tester
        it("flags the answer sets for the new basic-functionality book correctly", async function () {
            let result = await testBookActions.getLatestForTopicWithTests("basic-functionality");
            let basicFuncBook = result.testBook;
            let dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK(), { testBookId: basicFuncBook.id}, jwt);
            let answerSets = dbres.data.answerSets;
            let flags = answerSets.map(aset => aset.flag);
            expect(flags).to.not.contain(false);
        });
        it("created new answer sets for the test books", async function() {
            let dbres = await db.query(Q.TEST_BOOKS.GET_LATEST(), {}, jwt);
            let testBooks = dbres.data.getLatestTestBooks;
            for (let testBook of testBooks) {
                dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK(), { testBookId: testBook.id}, jwt);
                expect(dbres.data.answerSets.length).to.equal(2);
            }
        });
        it("flagged the answers for the flagged tests", async function() {
            // tests file-010 and file-310 are now flagged
            let result = await testBookActions.getLatestForTopicWithTests("basic-functionality");
            let basicFuncBook = result.testBook;
            
            for (let test of basicFuncBook.tests) {
                if (test.testId == "file-010" || test.testId == "file-310") {
                    expect(test.flag).to.be.true;
                }
            }
        });
        it("marked the still-published answer set for basic-functionality as not current", async function() {
            // the basic-functionality answer set is not current anymore
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED());
            let testenv = dbres.data.testingEnvironments[0];
            for (let answerSet of testenv.answerSets) {
                if (answerSet.testBook.id == 1) {
                    expect(answerSet.isLatestPublic).to.be.true;
                    expect(answerSet.isLatest).to.be.false;
                }
            }
        });
        it("does not list the new basic functionality answer set in the testing environment's public profile", async function() {
            let result = await testBookActions.getLatestForTopic("basic-functionality");
            let basicFuncBook = result.testBook;
            
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED());
            let testenv = dbres.data.testingEnvironments[0];
            // these are just the published answer sets
            for (let answerSet of testenv.answerSets) {
                // the basic functionality answer set should not be for the new book
                if (answerSet.testBook.topic.id == "basic-functionality") {
                    expect(answerSet.testBook.id).to.not.equal(basicFuncBook.id);
                }
            }
        });
        it("does list the new basic functionality answer set in the testing environment's private profile", async function() {
            let result = await testBookActions.getLatestForTopic("basic-functionality");
            let basicFuncBook = result.testBook;
            
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL(),  {}, jwt);
            let testenv = dbres.data.testingEnvironments[0];
            let answerSetTestBookIds = testenv.answerSets.map(aset => aset.testBook.id);
            expect(answerSetTestBookIds).to.contain(basicFuncBook.id);
        });
        // there were no flagged changes in this test book so the answer set can be automatically migrated and published
        it("auto-published the latest non-visual-reading answer set", async function() {
            let result = await testBookActions.getLatestForTopic("non-visual-reading");
            let nonVisBook = result.testBook;
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED());
            let testenv = dbres.data.testingEnvironments[0];
            // these are just the published answer sets
            let answerSetTestBookIds = testenv.answerSets.map(aset => aset.testBook.id);
            expect(answerSetTestBookIds).to.contain(nonVisBook.id);
        });
        it("reports the correct usage ", async function() {
            let result = await testBookActions.getLatestForTopic("non-visual-reading");
            let basicFuncBook = result.testBook;
            result = await testBookActions.getUsage(basicFuncBook.id, jwt);
            expect(result.answerSets.nonEmpty.length).to.equal(2);
            expect(result.answerSets.empty.length).to.equal(0);
            expect(result.answerSets.all.length).to.equal(2);
        });

        it("has the old timestamps", async function() {
            // get the upgraded version of our comparison answer set
            // the timestamp should not have changed
            let result = await testBookActions.getLatestForTopicWithTests("basic-functionality");
            let basicFuncBook = result.testBook;
            let dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK_AND_TESTING_ENVIRONMENT(), 
                { 
                    testBookId: basicFuncBook.id,
                    testingEnvironmentId: comparisonAnswerSet.testingEnvironment.id
                }, 
                jwt);
            let answerSet = dbres.data.answerSets[0]; // the new version of comparisonAnswerSet
            let answer = answerSet.answers.find(a => a.test.testId == "file-110"); // the new version of comparisonAnswer

            expect(answerSet.lastModified).to.equal(comparisonAnswerSet.lastModified);
            expect(answer.lastModified).to.equal(comparisonAnswer.lastModified);
        });
    });

    describe('record new results (don`t publish)', function () {
        before(async function() {
            let dataProfile = {
                answers: "./data/answers-second-set.json"
            };
            await loadSecondAnswers(jwt, dataProfile);
        });
        it("has the right scores", async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL(),  {}, jwt);
            let answerSets = dbres.data.answerSets;
            for (let answerSet of answerSets) {
                if (answerSet.testBook.id == 3 && answerSet.testingEnvironment.id == 1) {
                    expect(parseFloat(answerSet.score)).to.equal(0);
                }
                else if (answerSet.testBook.id == 4 && answerSet.testingEnvironment.id == 1) {
                    expect(parseFloat(answerSet.score)).to.equal(100.00);
                }
            }   
        });
        it("lists the new non-vis book's answer set in the testing environment's public profile", async function() {
            let result = await testBookActions.getLatestForTopic("non-visual-reading");
            let nonVisBook = result.testBook;
    
            // this gets the testing env with its published answer sets
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED());
            let testenv = dbres.data.testingEnvironments[0];
            let testBookIds = testenv.answerSets.map(aset => aset.testBook.id);
            expect(testBookIds).to.contain(nonVisBook.id);
        });
        it ("does not list the old non-vis book's answer set in the testing environment's public profile", async function() {
            let oldNonVisBookId = 2;
            // this gets the testing env with its published answer sets
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED());
            let testenv = dbres.data.testingEnvironments[0];
            let testBookIds = testenv.answerSets.map(aset => aset.testBook.id);
            expect(testBookIds).to.not.contain(oldNonVisBookId);
        });
        it("does not list the basic-func book's answer set in the testing environment's public profile", async function() {
            let result = await testBookActions.getLatestForTopic("basic-functionality");
            let basicFuncBook = result.testBook;
            
            // this gets the testing env with its published answer sets
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED());
            let testenv = dbres.data.testingEnvironments[0];
            let testBookIds = testenv.answerSets.map(aset => aset.testBook.id);
            expect(testBookIds).to.not.contain(basicFuncBook.id);
        });
    });

    describe('delete a test book and its answer sets', function () {
        before(async function() {
            //await testBookAndAnswerSetActions.remove(3, jwt);
            let dbres = await db.query(
                Q.TEST_BOOKS.DELETE_TEST_BOOK_AND_ANSWER_SETS(), 
                {testBookId: 3},
                jwt
            );
        });
        it("answer sets for book with ID=1 are the latest", async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK(), {testBookId: 1}, jwt);
            let isLatests = dbres.data.answerSets.map(aset => aset.isLatest);
            expect(isLatests).to.not.contain(false);
        });
    });
});

