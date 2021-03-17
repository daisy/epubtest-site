import initExpressApp from '../../src/app.js';
import winston from 'winston';
import { initDb, assignAnswerSets, loadFirstAnswersAndPublish, upgradeTestSuite, loadSecondAnswers } from "../test-data-operations/load-data.js";

async function setup() {

    winston.add(new winston.transports.Console({format: winston.format.simple()}));
    winston.level = 'debug';
    const port = process.env.PORT || 8000;

    await loadTestData();

    let app = await initExpressApp();
    let server = app.listen(port, () => winston.log('info', `epubtest listening on port ${port}!`))
    return server;
}
async function teardown(server) {
    await server.close();
}
async function mochaGlobalSetup() {
    this.server = await setup();
}
async function mochaGlobalTeardown() {
    await teardown(this.server);
}
async function loadTestData() {
    let dataProfile = {
        langs: "./data/langs.json",
        topics: "./data/topics.json",
        testBooks: "./data/test-books.json",
        software: "./data/software.json",
        testingEnvironments: "./data/testing-environments.json",
        users: "./data/users.json",
        answers: "./data/answers-first-set.json",
        upgrade: "./data/upgrade-test-books.json"
    };
    let jwt = await initDb(dataProfile);
    await assignAnswerSets(jwt);
    await loadFirstAnswersAndPublish(jwt, dataProfile);
    await upgradeTestSuite(jwt, dataProfile);
    
    dataProfile.answers = "./data/answers-second-set.json";
    await loadSecondAnswers(jwt, dataProfile);
}

export {
    setup,
    teardown,
    mochaGlobalSetup,
    mochaGlobalTeardown
}