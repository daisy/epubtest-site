const fs = require('fs-extra');
const path = require('path');
const envFile = process.argv.length > 2 ? 
    process.argv[2] : ".env";
if (process.env.NODE_ENV != 'production') {
    require('dotenv').config({path: path.join(__dirname, `../.testenv`)});
}

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

let errmgr = require('./errmgr');
module.exports.errmgr = errmgr;

module.exports.initDb = async function (dataProfile) {
    // test query
    let dbres = await db.query(Q.TEST_BOOKS.GET_ALL, {});
    if (!dbres.success) {
        winston.error("COULD NOT REACH THE DB API SERVER");
        winston.error("MAKE SURE THE `reset-testdb.sh` SCRIPT WAS ALREADY CALLED AND THE GRAPHQL SERVER IS RUNNING ON PORT 3000");
        throw new Error("Server likely not available");
    }
    
    try {
        let jwt = await initializeDb(dataProfile);
        return jwt;
    }
    catch (err) {
        return null; // query module.errors for details
    }
}


// to be called after initDb
module.exports.assignAnswerSets = async function(jwt) {
    try {
        await assignAnswerSets(jwt, errmgr);
        return true;
    }
    catch (err) {
        return false; // query module.errors for details
    }
}

// to be called after assignAnswerSets
module.exports.loadFirstAnswersAndPublish = async function(jwt, dataProfile) {
    try {
        let data = await readJson(dataProfile.answers);
        await updateAnswersAndPublish(data, jwt, true, errmgr);
        return true;
    }
    catch(err) {
        return false; // query module.errors for details
    }
    
}

// to be called after loadFirstAnswersAndPublish
module.exports.upgradeTestSuite = async function(jwt, dataProfile) {
    try {
        let jsonFile = dataProfile.upgrade;
        let datafilepath = path.resolve(__dirname, jsonFile);
        data = await readJson(jsonFile);
        let addedBooks = await addTestBooks(data, jwt, datafilepath, errmgr);

        // upgrade the results
        for (entry of addedBooks) {
            await upgradeAnswerSets(entry.newBookId, entry.replacesBookId, jwt, errmgr);
        }
        return true;
    }
    catch (err) {
        return false; // query module.errors for details
    }
}

// to be called after upgradeTestSuite
module.exports.loadSecondAnswers = async function(jwt, dataProfile) {
    try {
        let data = await readJson(dataProfile.answers);
        await updateAnswersAndPublish(data, jwt, false, errmgr);
    }
    catch (err) {
        return false; // query module.errors for details
    }
}

async function initializeDb (dataProfile) {
    
    try {
        await wipeDb();
    }
    catch (err) {
        throw err;
    }
    
    
    let jwt = await login();
    if (jwt) {
        try {
            
            let data = await readJson(dataProfile.langs);
            await addLangs(data, jwt, errmgr);

            data = await readJson(dataProfile.topics);
            await addTopics(data, jwt, errmgr);

            let jsonFile = dataProfile.testBooks;
            let datafilepath = path.resolve(__dirname, jsonFile);
            data = await readJson(jsonFile);
            await addTestBooks(data, jwt, datafilepath, errmgr); // need the filepath for context

            data = await readJson(dataProfile.software);
            await addSoftware(data, jwt, errmgr);

            data = await readJson(dataProfile.testingEnvironments);
            await addTestingEnvironments(data, jwt, errmgr);

            data = await readJson(dataProfile.users);
            await addUsers(data, jwt, errmgr);

            winston.log('info', "Ready");
        }
        catch (err) {
            throw err;
        }
    }
    return jwt;
}

// clear all data from the database
async function wipeDb() {
    let jwt = await login();
    // delete all rows from all tables except for DbInfo
    let dbres = await db.query(Q.ETC.DELETE_ALL_DATA, {}, jwt);
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        winston.error("Could not wipe data");
        throw new Error();
    }

    // re-add the admin login
    dbres = await db.query(Q.LOGINS.CREATE_NEW_LOGIN, 
        {
            email: "admin@example.com",
            password: "password"
        }, 
        jwt);
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        winston.error("Could not create new login");
        throw new Error();
    }
    let newLoginId = dbres.data.createNewLogin.integer;

    dbres = await db.query(Q.LOGINS.UPDATE, {id: newLoginId, patch: {type: 'ADMIN'}}, jwt);
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        winston.error("Could not make new login an admin");
        throw new Error();
    }

    dbres = await db.query(Q.USERS.CREATE, {input: {name: 'Administrator', loginId: newLoginId}}, jwt);
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        winston.error("Could create user for new login");
        throw new Error();
    }
    winston.info("Cleared data");
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
        throw new Error("Login error");
    }

    return dbres.data.authenticate.jwtToken;
}

async function readJson(filename) {
    let data = await fs.readFile(path.resolve(__dirname, filename), {encoding: "utf-8"});
    return JSON.parse(data);
}

// const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

// this resets the db schema and restarts the graphql api server
// but it has issues
// async function resetDb() {
//     winston.log('info', process.cwd());
//     const child = spawn(`${process.cwd()}/test/reset-testdb.sh`, []);
//     // try {
        
//     // }
//     // catch (err) {
//     //     winston.error(err);
//     // }
// }
// resets the database, gets a login, adds initial dataset
// returns jwt just for convenience
// module.exports.initDbFromScratch = async function(dataProfile) {
//     console.log("INIT DB");
//     try {
//         await resetDb();
//         // wait for the api to start
//         await wait(3000);
//         let jwt = await initializeDb(dataProfile);
//         return jwt;
//     }
//     catch (err) {
//         return null; // query module.errors for details
//     }
// }


