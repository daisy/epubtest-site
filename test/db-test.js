const Q = require("../src/queries/index");
const db = require("../src/database");
const { initDbFromScratch, loadFirstAnswersAndPublish, upgradeTestSuite, assignAnswerSets, initializeDb } = require('./load-data');
const {expect} = require('chai');
const winston = require('winston');
const testBookActions = require('../src/actions/testBooks');

let jwt;

describe('upgrade-test-books', function () {
    this.timeout(5000);
    before(async function () {
        winston.add(new winston.transports.Console({format: winston.format.simple()}));
        winston.level = 'debug';
        //jwt = await initDbFromScratch(); // this runs reset-db.sh and sometimes the process hangs
        jwt = await initializeDb(); // this assumes you've run reset-db.sh manually and are managing the api server (on port 3000)
    });
  
    describe('initial-data-import', function() {
        it('has two users', async function () {
            let dbres = await db.query(Q.USERS.GET_ALL, {}, jwt);
            expect(dbres.data.users.nodes.length).to.equal(2);
        });
        it('has one testing environment', async function() {
                let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL, {}, jwt);
                expect(dbres.data.testingEnvironments.nodes.length).to.equal(1);
        });
        it('has two test books', async function() {
            let dbres = await db.query(Q.TEST_BOOKS.GET_ALL, {}, jwt);
            expect(dbres.data.testBooks.nodes.length).to.equal(2);
        });
        it('has three tests per test book', async function() {
            let dbres = await db.query(Q.TEST_BOOKS_WITH_TESTS.GET_ALL, {}, jwt);
            let testBooks = dbres.data.testBooks.nodes;
            for (testBook of testBooks) {
                expect(testBook.testsByTestBookId.nodes.length).to.equal(3);
            }
        });
        it('has two answer sets per testing environment', async function () {
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL, {}, jwt);
            let testingEnvironments = dbres.data.testingEnvironments.nodes;
            for (testingEnvironment of testingEnvironments) {
                expect(testingEnvironment.answerSetsByTestingEnvironmentId.nodes.length).to.equal(2);
            }
        });
        it('has one answer set per test book', async function() {
            let dbres = await db.query(Q.TEST_BOOKS.GET_ALL, {}, jwt);
            let testBooks = dbres.data.testBooks.nodes;
            for (testBook of testBooks) {
                dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK, {testBookId: testBook.id}, jwt);
                expect(dbres.data.answerSets.nodes.length).to.equal(1);
            }
        });
        it('has three answers per answer set', async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL, {}, jwt);
            let answerSets = dbres.data.answerSets.nodes;
            for (answerSet of answerSets) {
                expect(answerSet.answersByAnswerSetId.nodes.length).to.equal(3);
            }
        });
        it('has NOANSWER for every answer value', async function() {
            let dbres = await db.query(Q.ANSWERS.GET_ALL, {}, jwt);
            let answers = dbres.data.answers.nodes;
            for (answer of answers) {
                expect(answer.value).to.equal('NOANSWER');
            }
        });
        it('has no user assigned to any answer sets', async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL, {}, jwt);
            let answerSets = dbres.data.answerSets.nodes;
            for (answerSet of answerSets) {
                expect(answerSet.user).to.be.null;
            }
        });
        it("has no public answer sets", async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL, {}, jwt);
            let answerSets = dbres.data.answerSets.nodes;
            for (answerSet of answerSets) {
                expect(answerSet.isPublic).to.be.false;
            }
        });
        it("has a score of zero for every answer set", async function () {
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL, {}, jwt);
            let answerSets = dbres.data.answerSets.nodes;
            for (answerSet of answerSets) {
                expect(parseFloat(answerSet.score)).to.equal(0.0);
            }
        });
        it("has one OS", async function() {
            let dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('Os'), {}, jwt);
            expect(dbres.data.softwares.nodes.length).to.equal(1);
        });
        it("has one AT", async function() {
            let dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('AssistiveTechnology'), {}, jwt);
            expect(dbres.data.softwares.nodes.length).to.equal(1);
        });
        it("has one RS", async function() {
            let dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('ReadingSystem'), {}, jwt);
            expect(dbres.data.softwares.nodes.length).to.equal(1);
        });
    });

    describe('assign answer sets to user', function() {
        before(async function() {
            await assignAnswerSets(jwt);
        });
        describe('answer sets are assigned', function() {
            it("each answer set is assigned to a non-admin user", async function() {
                let dbres = await db.query(Q.ANSWER_SETS.GET_ALL_EXTENDED, {}, jwt);
                let answerSets = dbres.data.answerSets.nodes;
                for (answerSet of answerSets) {
                    expect(answerSet.user).to.not.be.null;
                    expect(answerSet.user.login.type).to.equal('USER');
                }
            });
        });
    });

    describe('add answers and publish', function() {
        before(async function() {
            await loadFirstAnswersAndPublish(jwt);
        });

        it("recorded the answers", async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL, {}, jwt);
            let answerSets = dbres.data.answerSets.nodes;
            for (answerSet of answerSets) {
                if (answerSet.id == 1) {
                    for (answer of answerSet.answersByAnswerSetId.nodes) {
                        if (answer.test.testId == "file-010") {
                            expect(answer.value).to.equal('PASS');
                        }
                        else if (answer.test.testId == "file-110") {
                            expect(answer.value).to.equal("FAIL");
                        }
                        else if (answer.test.testId == "file-210") {
                            expect(answer.value).to.equal('PASS');
                        }
                    }
                }
                else if (answerSet.id == 2) {
                    for (answer of answerSet.answersByAnswerSetId.nodes) {
                        expect(answer.value).to.equal('PASS');
                    }
                }
            }
        });
        it("published the answer sets", async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL, {}, jwt);
            let answerSets = dbres.data.answerSets.nodes;
            for (answerSet of answerSets) {
                expect(answerSet.isPublic).to.be.true;
            }   
        });
        it("has the right scores", async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL, {}, jwt);
            let answerSets = dbres.data.answerSets.nodes;
            for (answerSet of answerSets) {
                if (answerSet.id == 1) {
                    expect(parseFloat(answerSet.score)).to.equal(66.67);
                }
                else if (answerSet.id == 2) {
                    expect(parseFloat(answerSet.score)).to.equal(100.00);
                }
            }   
        });
    });

    describe('upgrade test suite', function () {
        before(async function() {
            await upgradeTestSuite(jwt);
        });
        it("has four test books", async function() {
            let dbres = await db.query(Q.TEST_BOOKS.GET_ALL, {}, jwt);
            expect(dbres.data.testBooks.nodes.length).to.equal(4);
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
            let dbres = await db.query(Q.TEST_BOOKS.GET_LATEST, {}, jwt);
            let testBooks = dbres.data.getLatestTestBooks.nodes;
            for (tb of testBooks) {
                dbres = await db.query(Q.TEST_BOOKS_WITH_TESTS.GET, { id: tb.id });
                let testBook = dbres.data.testBook;
                expect(testBook.testsByTestBookId.nodes.length).to.equal(3);
            }
        });
        it("does not have test file-210", async function() {
            let result = await testBookActions.getLatestForTopicWithTests("basic-functionality");
            let basicFuncBook = result.testBook;
            
            expect(basicFuncBook.testsByTestBookId.nodes["file-210"]).to.be.undefined;
        });
        it("flagged the tests correctly", async function() {
            let result = await testBookActions.getLatestForTopicWithTests("basic-functionality");
            let basicFuncBook = result.testBook;
            
            for (test of basicFuncBook.testsByTestBookId.nodes) {
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
        it("created new answer sets for the test books", async function() {
            let dbres = await db.query(Q.TEST_BOOKS.GET_LATEST, {}, jwt);
            let testBooks = dbres.data.getLatestTestBooks.nodes;
            for (testBook of testBooks) {
                dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK, { testBookId: testBook.id}, jwt);
                expect(dbres.data.answerSets.nodes.length).to.equal(1);
            }
        });
        it("flagged the answers for the flagged tests", async function() {
            // tests file-010 and file-310 are now flagged
            let result = await testBookActions.getLatestForTopicWithTests("basic-functionality");
            let basicFuncBook = result.testBook;
            
            for (test of basicFuncBook.testsByTestBookId.nodes) {
                if (test.testId == "file-010" || test.testId == "file-310") {
                    expect(test.flag).to.be.true;
                }
            }
        });
        it("flagged the still-published answer set for basic-functionality as not current", async function() {
            // the basic-functionality answer set is not current anymore
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_PUBLISHED);
            let testenv = dbres.data.getPublishedTestingEnvironments.nodes[0];
            for (answerSet of testenv.answerSetsByTestingEnvironmentId.nodes) {
                if (answerSet.testBook.topic.id == "basic-functionality") {
                    expect(answerSet.flag).to.be.true;
                }
            }
        });
        it("does not list the new basic functionality answer set in the testing environment's public profile", async function() {
            let result = await testBookActions.getLatestForTopic("basic-functionality");
            let basicFuncBook = result.testBook;
            
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_PUBLISHED);
            let testenv = dbres.data.getPublishedTestingEnvironments.nodes[0];
            // these are just the published answer sets
            for (answerSet of testenv.answerSetsByTestingEnvironmentId.nodes) {
                // the basic functionality answer set should not be for the new book
                if (answerSet.testBook.topic.id == "basic-functionality") {
                    expect(answerSet.testBook.id).to.not.equal(basicFuncBook.id);
                }
            }
        });
        it("does list the new basic functionality answer set in the testing environment's private profile", async function() {
            let result = await testBookActions.getLatestForTopic("basic-functionality");
            let basicFuncBook = result.testBook;
            
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL, {}, jwt);
            let testenv = dbres.data.testingEnvironments.nodes[0];
            let answerSetTestBookIds = testenv.answerSetsByTestingEnvironmentId.nodes.map(aset => aset.testBook.id);
            expect(answerSetTestBookIds).to.contain(basicFuncBook.id);
        });
        // there were no flagged changes in this test book so the answer set can be automatically migrated and published
        it("auto-published the latest non-visual-reading answer set", async function() {
            let result = await testBookActions.getLatestForTopic("non-visual-reading");
            let nonVisBook = result.testBook;
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_PUBLISHED);
            let testenv = dbres.data.getPublishedTestingEnvironments.nodes[0];
            // these are just the published answer sets
            let answerSetTestBookIds = testenv.answerSetsByTestingEnvironmentId.nodes.map(aset => aset.testBook.id);
            expect(answerSetTestBookIds).to.contain(nonVisBook.id);
        });
    });
});

describe('record new results', function () {
    before(async function() {
        // 
    });
    it.skip("updated the scores", async function() {

    });
    it.skip("published the new answer sets", async function() {

    });
    it.skip("lists the new answer sets in the testing environment's public profile", async function() {

    });

});
