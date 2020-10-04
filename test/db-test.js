const Q = require("../src/queries/index");
const db = require("../src/database");
const { initDb, loadFirstAnswersAndPublish, upgradeTestSuite, 
    assignAnswerSets, loadSecondAnswers, errmgr: loadDataErrors } = require('./load-data');
const {expect} = require('chai');
const winston = require('winston');
const testBookActions = require('../src/actions/testBooks');

let jwt;

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
    });
  
    describe('initial-data-import', function() {
        it('does not report errors', async function() {
            expect(loadDataErrors.getErrors().length).to.equal(0);
        });
        it('has two users', async function () {
            let dbres = await db.query(Q.USERS.GET_ALL, {}, jwt);
            expect(dbres.data.users.nodes.length).to.equal(2);
        });
        it('has two testing environments', async function() {
                let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL, {}, jwt);
                expect(dbres.data.testingEnvironments.nodes.length).to.equal(2);
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
        it('has two answer sets per test book', async function() {
            let dbres = await db.query(Q.TEST_BOOKS.GET_ALL, {}, jwt);
            let testBooks = dbres.data.testBooks.nodes;
            for (testBook of testBooks) {
                dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK, {testBookId: testBook.id}, jwt);
                expect(dbres.data.answerSets.nodes.length).to.equal(2);
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
        it("has two ATs", async function() {
            let dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('AssistiveTechnology'), {}, jwt);
            expect(dbres.data.softwares.nodes.length).to.equal(2);
        });
        it("has two RSes", async function() {
            let dbres = await db.query(Q.SOFTWARE.GET_ALL_BY_TYPE('ReadingSystem'), {}, jwt);
            expect(dbres.data.softwares.nodes.length).to.equal(2);
        });
        it("reports the correct usage ", async function() {
            let dbres = await db.query(Q.TEST_BOOKS.GET_ALL, {});
            let id = dbres.data.testBooks.nodes[0].id; // just grab the first test book
            let result = await testBookActions.getUsage(id, jwt);
            expect(result.answerSets.nonEmpty.length).to.equal(0);
            expect(result.answerSets.empty.length).to.equal(2);
            expect(result.answerSets.all.length).to.equal(2);
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
            let dataProfile = {
                answers: "./data/answers-first-set.json"
            };
            await loadFirstAnswersAndPublish(jwt, dataProfile);
        });

        it("recorded the answers", async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL, {}, jwt);
            let answerSets = dbres.data.answerSets.nodes;
            for (answerSet of answerSets) {
                if (answerSet.testBook.topic.id == 'basic-functionality' 
                    && answerSet.testingEnvironment.readingSystem.name == 'BookReader') {
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
                else if (answerSet.testBook.topic.id == 'non-visual-reading'
                    && answerSet.testingEnvironment.readingSystem.name == 'BookReader') {
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
                if (answerSet.testBook.topic.id == 'basic-functionality' 
                    && answerSet.testingEnvironment.readingSystemName == "BookReader") {
                    expect(parseFloat(answerSet.score)).to.equal(66.67);
                }
                else if (answerSet.testBook.topic.id == 'non-visual-reading'
                    && answerSet.testingEnvironment.readingSystemName == "BookReader") {
                    expect(parseFloat(answerSet.score)).to.equal(100.00);
                }
            }   
        });
    });

    describe('upgrade test suite', function () {
        before(async function() {
            let dataProfile = {
                upgrade: "./data/upgrade-test-books.json"
            };
            await upgradeTestSuite(jwt, dataProfile);
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
        // a flag on an answer set means that it requires attention from the tester
        it("flags the answer sets for the new basic-functionality book correctly", async function () {
            let result = await testBookActions.getLatestForTopicWithTests("basic-functionality");
            let basicFuncBook = result.testBook;
            let dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK, { testBookId: basicFuncBook.id}, jwt);
            let answerSets = dbres.data.answerSets.nodes;
            let flags = answerSets.map(aset => aset.flag);
            expect(flags).to.not.contain(false);
        });
        it("created new answer sets for the test books", async function() {
            let dbres = await db.query(Q.TEST_BOOKS.GET_LATEST, {}, jwt);
            let testBooks = dbres.data.getLatestTestBooks.nodes;
            for (testBook of testBooks) {
                dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK, { testBookId: testBook.id}, jwt);
                expect(dbres.data.answerSets.nodes.length).to.equal(2);
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
        it("marked the still-published answer set for basic-functionality as not current", async function() {
            // the basic-functionality answer set is not current anymore
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED);
            let testenv = dbres.data.testingEnvironments.nodes[0];
            for (answerSet of testenv.answerSetsByTestingEnvironmentId.nodes) {
                if (answerSet.testBook.id == 1) {
                    expect(answerSet.isLatestPublic).to.be.true;
                    expect(answerSet.isLatest).to.be.false;
                }
            }
        });
        it("does not list the new basic functionality answer set in the testing environment's public profile", async function() {
            let result = await testBookActions.getLatestForTopic("basic-functionality");
            let basicFuncBook = result.testBook;
            
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED);
            //let testenv = dbres.data.getPublishedTestingEnvironments.nodes[0];
            let testenv = dbres.data.testingEnvironments.nodes[0];
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
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED);
            //let testenv = dbres.data.getPublishedTestingEnvironments.nodes[0];
            let testenv = dbres.data.testingEnvironments.nodes[0];
            // these are just the published answer sets
            let answerSetTestBookIds = testenv.answerSetsByTestingEnvironmentId.nodes.map(aset => aset.testBook.id);
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
    });

    describe('record new results (don`t publish)', function () {
        before(async function() {
            let dataProfile = {
                answers: "./data/answers-second-set.json"
            };
            await loadSecondAnswers(jwt, dataProfile);
        });
        it("has the right scores", async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL, {}, jwt);
            let answerSets = dbres.data.answerSets.nodes;
            for (answerSet of answerSets) {
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
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED);
            //let testenv = dbres.data.getPublishedTestingEnvironments.nodes[0];
            let testenv = dbres.data.testingEnvironments.nodes[0];
            let testBookIds = testenv.answerSetsByTestingEnvironmentId.nodes.map(aset => aset.testBook.id);
            expect(testBookIds).to.contain(nonVisBook.id);
        });
        it ("does not list the old non-vis book's answer set in the testing environment's public profile", async function() {
            let oldNonVisBookId = 2;
            // this gets the testing env with its published answer sets
            dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED);
            let testenv = dbres.data.testingEnvironments.nodes[0];
            let testBookIds = testenv.answerSetsByTestingEnvironmentId.nodes.map(aset => aset.testBook.id);
            expect(testBookIds).to.not.contain(oldNonVisBookId);
        });
        it("does not list the basic-func book's answer set in the testing environment's public profile", async function() {
            let result = await testBookActions.getLatestForTopic("basic-functionality");
            let basicFuncBook = result.testBook;
            
            // this gets the testing env with its published answer sets
            let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL_PUBLISHED);
            //let testenv = dbres.data.getPublishedTestingEnvironments.nodes[0];
            let testenv = dbres.data.testingEnvironments.nodes[0];
            let testBookIds = testenv.answerSetsByTestingEnvironmentId.nodes.map(aset => aset.testBook.id);
            expect(testBookIds).to.not.contain(basicFuncBook.id);
        });
    });

    describe('delete a test book and its answer sets', function () {
        before(async function() {
            await testBookAndAnswerSetActions.remove(3, jwt);
        });
        it("answer sets for book with ID=1 are the latest", async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK, {testBookId: 1}, jwt);
            let isLatests = dbres.data.answerSets.nodes.map(aset => aset.isLatest);
            expect(isLatests).to.not.contain(false);
        });
    });
});

