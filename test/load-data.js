const fs = require('fs-extra');
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../.env')});
const winston = require('winston');

const { spawn } = require('child_process')

const Q = require("../src/queries/index");
const db = require("../src/database");
const addLangs = require('./dbops/add-langs');
const addSoftware = require('./dbops/add-software');
const addTestBooks = require('./dbops/add-test-books');
const addTestingEnvironments = require('./dbops/add-testing-environments');
const addTopics = require('./dbops/add-topics');
const addUsers = require('./dbops/add-users');
const assignAnswerSets = require('./dbops/assign-answer-sets');
const updateAnswersAndPublish = require('./dbops/update-answers-and-publish');
const upgradeAnswerSets = require('./dbops/upgrade-answer-sets');

const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

// resets the database, gets a login, adds initial dataset
// returns jwt just for convenience
module.exports.initDbFromScratch = async function() {
    console.log("INIT DB");
    await resetDb();
    // wait for the api to start
    await wait(3000);
    let jwt = await initializeDb(jwt);
    return jwt;
}
module.exports.initializeDb = async function() {
    winston.info("MAKE SURE THE reset-db.sh SCRIPT WAS ALREADY CALLED");
    let jwt = await login();
    if (jwt) {
        let data = await readJson('./data/initial/langs.json');
        await addLangs(data, jwt);

        data = await readJson('./data/initial/topics.json');
        await addTopics(data, jwt);

        let jsonFile = './data/initial/test-books.json';
        let datafilepath = path.resolve(__dirname, jsonFile);
        data = await readJson(jsonFile);
        await addTestBooks(data, jwt, datafilepath); // need the filepath for context

        data = await readJson('./data/initial/software.json');
        await addSoftware(data, jwt);

        data = await readJson('./data/initial/testing-environments.json');
        await addTestingEnvironments(data, jwt);

        data = await readJson('./data/initial/users.json');
        await addUsers(data, jwt);

        winston.log('info', "Ready");
    }
    return jwt;
}
// to be called after initDb
module.exports.assignAnswerSets = async function(jwt) {
    await assignAnswerSets(jwt);
}

// to be called after initDb
module.exports.loadFirstAnswersAndPublish = async function(jwt) {
    let data = await readJson('./data/answers-first-set/answers.json');
    await updateAnswersAndPublish(data, jwt);
}

// to be called after initDb and loadFirstAnswersAndPublish
module.exports.upgradeTestSuite = async function(jwt) {
    let jsonFile = './data/upgrade-test-suite/test-books.json';
    let datafilepath = path.resolve(__dirname, jsonFile);
    data = await readJson(jsonFile);
    let addedBooks = await addTestBooks(data, jwt, datafilepath);

    // upgrade the results
    for (entry of addedBooks) {
        await upgradeAnswerSets(entry.newBookId, entry.replacesBookId, jwt);
    }
}

async function resetDb() {
    winston.log('info', process.cwd());
    try {
        const child = spawn(`${process.cwd()}/test/reset-db.sh`, []);
    }
    catch (err) {
        winston.error(err);
    }
}

async function login() {
    let dbres = await db.query(Q.AUTH.LOGIN, {
        input: {
            "email": "admin@example.com",
            "password": "password"
        }
    });

    if (!dbres.success) {
        winston.error("Login error");
        return null;
    }

    return dbres.data.authenticate.jwtToken;
}

async function readJson(filename) {
    let data = await fs.readFile(path.resolve(__dirname, filename), {encoding: "utf-8"});
    return JSON.parse(data);
}
