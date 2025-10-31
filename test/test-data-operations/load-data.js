import fs from 'fs-extra';
import * as path from 'path';

import winston from 'winston';

import * as Q from '../../src/queries/index.js';
import * as db from "../../src/database/index.js";
import * as dbops from './dbops/index.js';

import * as errmgr from './errmgr.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function initDb(dataProfile) {
    try {
        await db.initDatabaseConnection();
    }
    catch (err) {
        console.log(err);
        throw err;
    }

    try {
        let jwt = await login("admin@example.com", "password");
        if (!jwt) {
            throw new Error("Could not login");
        }

        await wipeDb(jwt);
        let data = await readJson(dataProfile.langs);
        await dbops.addLangs(data, jwt, errmgr);

        data = await readJson(dataProfile.topics);
        await dbops.addTopics(data, jwt, errmgr);

        let jsonFile = dataProfile.testBooks;
        let datafilepath = path.resolve(__dirname, jsonFile);
        data = await readJson(jsonFile);
        await dbops.addTestBooks(data, jwt, datafilepath, errmgr); // need the filepath for context

        data = await readJson(dataProfile.software);
        await dbops.addSoftware(data, jwt, errmgr);

        data = await readJson(dataProfile.testingEnvironments);
        await dbops.addTestingEnvironments(data, jwt, errmgr);

        data = await readJson(dataProfile.users);
        await dbops.addUsers(data, jwt, errmgr);

        winston.log('info', "Ready");
        return jwt;
    }
    catch (err) {
        throw err;
    }
}

// to be called after initDb
async function assignAnswerSets(jwt) {
    try {
        await dbops.assignAnswerSets(jwt, errmgr);
        return true;
    }
    catch (err) {
        return false; // query module.errors for details
    }
}

// to be called after assignAnswerSets
async function loadFirstAnswersAndPublish(jwt, dataProfile) {
    try {
        let data = await readJson(dataProfile.answers);
        await dbops.updateAnswersAndPublish(data, jwt, true, errmgr);
        return true;
    }
    catch(err) {
        return false; // query module.errors for details
    }
    
}

// to be called after loadFirstAnswersAndPublish
async function upgradeTestSuite(jwt, dataProfile) {
    try {
        let jsonFile = dataProfile.upgrade;
        let datafilepath = path.resolve(__dirname, jsonFile);
        let data = await readJson(jsonFile);
        let addedBooks = await dbops.addTestBooks(data, jwt, datafilepath, errmgr);

        // upgrade the results
        for (let entry of addedBooks) {
            await dbops.upgradeAnswerSets(entry.newBookId, entry.replacesBookId, jwt, errmgr);
        }
        return true;
    }
    catch (err) {
        return false; // query module.errors for details
    }
}

// to be called after upgradeTestSuite
async function loadSecondAnswers (jwt, dataProfile) {
    try {
        let data = await readJson(dataProfile.answers);
        await dbops.updateAnswersAndPublish(data, jwt, false, errmgr);
    }
    catch (err) {
        return false; // query module.errors for details
    }
}


// clear all data from the database
async function wipeDb(jwt) {
    // delete all rows from all tables except for DbInfo
    let dbres = await db.query(Q.ETC.DELETE_ALL_DATA(), {}, jwt);
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        winston.error("Could not wipe data");
        throw new Error();
    }

    // re-add the admin login
    dbres = await db.query(Q.LOGINS.CREATE_NEW_LOGIN(), 
        {
            email: "admin@example.com",
            password: "password",
            active: true
        }, 
        jwt);
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        winston.error("Could not create new login");
        throw new Error();
    }
    let newLoginId = dbres.data.createNewLogin.integer;

    dbres = await db.query(Q.LOGINS.UPDATE(),  {id: newLoginId, patch: {type: 'ADMIN'}}, jwt);
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        winston.error("Could not make new login an admin");
        throw new Error();
    }

    dbres = await db.query(Q.USERS.CREATE(),  {input: {name: 'Administrator', loginId: newLoginId}}, jwt);
    if (!dbres.success) {
        errors = errors.concat(dbres.errors);
        winston.error("Could create user for new login");
        throw new Error();
    }
    winston.info("Cleared data");
}

async function login (email, password) {
    let dbres = await db.query(Q.AUTH.LOGIN(), {
        input: {
            email, 
            password
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

export {
    errmgr,
    initDb,
    login,
    assignAnswerSets,
    loadFirstAnswersAndPublish,
    loadSecondAnswers,
    upgradeTestSuite
};

