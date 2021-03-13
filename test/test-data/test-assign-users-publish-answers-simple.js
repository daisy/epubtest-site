import * as Q from '../../src/queries/index.js';
import * as db from "../../src/database/index.js";

import { initDb, loadFirstAnswersAndPublish, upgradeTestSuite, 
    assignAnswerSets, errmgr as loadDataErrors } from './load-data.js';
import chai from 'chai';
const expect = chai.expect;
import winston from 'winston';

let jwt;

describe('assign-users-publish-answers-simple', function () {
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
  

    describe('assign answer sets to user', function() {
        before(async function() {
            await assignAnswerSets(jwt);
        });
        describe('answer sets are assigned', function() {
            it("each answer set is assigned to a non-admin user", async function() {
                let dbres = await db.query(Q.ANSWER_SETS.GET_ALL_EXTENDED(), {}, jwt);
                let answerSets = dbres.data.answerSets;
                for (let answerSet of answerSets) {
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
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL(),  {}, jwt);
            let answerSets = dbres.data.answerSets;
            for (let answerSet of answerSets) {
                if (answerSet.testBook.topic.id == 'basic-functionality' 
                    && answerSet.testingEnvironment.readingSystem.name == 'BookReader') {
                    for (let answer of answerSet.answers) {
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
                    for (let answer of answerSet.answers) {
                        expect(answer.value).to.equal('PASS');
                    }
                }
            }
        });
        it("published the answer sets", async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL(),  {}, jwt);
            let answerSets = dbres.data.answerSets;
            for (let answerSet of answerSets) {
                expect(answerSet.isPublic).to.be.true;
            }   
        });
        it("has the right scores", async function() {
            let dbres = await db.query(Q.ANSWER_SETS.GET_ALL(),  {}, jwt);
            let answerSets = dbres.data.answerSets;
            for (let answerSet of answerSets) {
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
});