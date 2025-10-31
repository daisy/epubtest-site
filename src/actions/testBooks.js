import { EPUB } from '../epub-parser/epub.js';
import * as db from '../database/index.js';
import * as Q from '../queries/index.js';

import semver from 'semver';
import fs from 'fs-extra';
import {undo} from './undo.js';
import winston from 'winston';
import * as path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// from the filepath, return a parsed representation of the test book
async function parse(epubFilepath, epubOrigFilename) {
    try {
        let testBook;
    
        try {
            fs.statSync(epubFilepath);
        }
        catch(err) {
            throw err;
        }
    
        let epub = new EPUB(epubFilepath);
        if (!epub) {
            throw new Error(`Could not initialize EPUB.`);
        }
        let epubx = await epub.extract();
        if (!epubx) {
            throw new Error(`Could not extract EPUB.`);
        }
        let bookdata = await epubx.parse();
        if (!bookdata) {
            throw new Error(`Could not parse EPUB`);
        }
        if (!bookdata.hasOwnProperty('metadata')
            || !bookdata.hasOwnProperty("navDoc") 
            || !bookdata.navDoc.hasOwnProperty("testsData")) {
            throw new Error(`Incorrect EPUB structure for test book ingestion.`);
        }

        if (!semver.valid(bookdata.metadata['schema:version'])) {
            throw new Error(`Incorrect EPUB version metadata ${bookdata.metadata['schema:version']}; cannot ingest.`);
        }
        
        testBook = {
            title: bookdata.metadata['dc:title'],
            topicId: bookdata.metadata['dc:subject'],
            description: bookdata.metadata['dc:description'],
            langId: bookdata.metadata['dc:language'],
            epubId: bookdata.uid,
            version: bookdata.metadata['schema:version'],
            filename: epubOrigFilename,
            path: epubFilepath,
            tests: bookdata.navDoc.testsData.map((t, idx)=>({
                testId: t.id,
                xhtml: t.xhtml,
                order: idx,
                flagChanged: false,
                flagNew: false,
                name: t.name,
                description: t.description
            })),
        };
        return { success: true, errors: [], testBook};
    }
    catch (err) {
        return {success: false, errors: [err]};
    }
}

// return whether the book can be added 
// and also the object representation of the book it is going to be an upgrade for, if exists
async function canAdd(parsedTestBook, jwt) {
    let errors = [];
    let currentBookForTopicAndLang = null;
    try {
        // does this topic exist
        let dbres = await db.query(Q.TOPICS.GET_ALL(),  {});
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        if (!dbres.data.topics.find(t=>t.id === parsedTestBook.topicId)) {
            throw new Error(`Topic ${parsedTestBook.topicId} not found.`);
        }
        // compare versions
        dbres = await db.query(Q.TEST_BOOKS.GET_LATEST(), {});
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        currentBookForTopicAndLang = dbres.data.testBooks
            .find(book => book.topicId === parsedTestBook.topicId && book.langId === parsedTestBook.langId);
        
        // are we upgrading an existing book? if so, does the new book have a newer version number?
        if (currentBookForTopicAndLang) {
            if (!semver.gt(parsedTestBook.version, currentBookForTopicAndLang.version)) {
                throw new Error(`This version (${parsedTestBook.version}) is not newer than the existing version (${currentBookForTopicAndLang.version}).`);
            }
        }
    }
    catch(err) {
        return {success: false, errors: errors.length > 0 ? errors : [err]};
    }
    return {success: true, errors, bookToUpgrade: currentBookForTopicAndLang};
}

// add flags to the new test book object, based on the book it will be an upgrade for
// returns testBook object
async function setFlags(testBook, bookToUpgrade, jwt) {
    let errors = [];
    try {
        let testsInCurrent = [];
        if (bookToUpgrade) {
            let dbres = await db.query(Q.TEST_BOOKS_WITH_TESTS.GET(),
                {id: bookToUpgrade.id}, jwt);
            if (!dbres.success) {
                errors = dbres.errors;
                throw new Error();
            }
            testsInCurrent = dbres.data.testBook.tests;    
        }
    
        // flag whichever tests are new
        let newTests = testBook.tests
            .filter(test => testsInCurrent.find(t => t.testId === test.testId) === undefined);
        newTests.map(test => testBook.tests.find(t => t.testId === test.testId).flagNew = true);

        /*
        // holding off on suggesting "changed" flags for now because it's difficult to compare XHTML strings
        // things like whitespace and attribute order differ in XHTML serializations generated by different systems
        // eg the old website vs this one
        // so, any change-based flagging we are able to do may not be very informative
        */
    }
    catch (err) {
        return { success: false, errors: errors.length > 0 ? errors : [err]};
    }
    return { success: true, errors, testBook};
}

// add a parsed, flagged testBook
// return the test book ID and the ID of the book that it is an upgrade for, if any
async function add(testBook, jwt) {
    let errors = [];
    let transactions = [];
    let addBookResult = null;
    let newTestBookInput = {
        input: {
            topicId: testBook.topicId,
            langId: testBook.langId,
            version: testBook.version,
            title: testBook.title,
            description: testBook.description,
            filename: testBook.filename,
            epubId: testBook.epubId,
            // translation: testBook.translation,
            // experimental: testBook.experimental,
            versionMajor: semver.major(testBook.version),
            versionMinor: semver.minor(testBook.version),
            versionPatch: semver.patch(testBook.version),
            downloadUrl: testBook.downloadUrl
        }
    };
    // console.log("translation", testBook.translation);
    // console.log("exp", testBook.experimental);
    console.log(JSON.stringify(newTestBookInput, null, '  '));
    try {
        let dbres = await db.query(
            Q.TEST_BOOKS.CREATE(),  
            newTestBookInput, 
            jwt);

        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        else {
            transactions.push({objectType: 'TEST_BOOKS', actionWas: 'CREATE', id: dbres.data.createTestBook.testBook.id});
            addBookResult = dbres.data.createTestBook.testBook;
            if (testBook.experimental == undefined || testBook.experimental == false) {
                // add the tests
                let i; 
                for (i = 0; i < testBook.tests.length; i++) {
                    let test = testBook.tests[i];
                    dbres = await db.query(
                        Q.TESTS.CREATE(),  
                        {
                            input: {
                                testId: test.testId,
                                testBookId: parseInt(addBookResult.id),
                                name: test.name,
                                description: test.description,
                                xhtml: test.xhtml,
                                order: i,
                                flag: test.flagNew || test.flagChanged
                            }
                        }, 
                        jwt);
                    if (!dbres.success) {
                        winston.error(`Error adding test ${test.testId}`);
                        errors = dbres.errors;
                        throw new Error();                
                    }
                    transactions.push({objectType: 'TESTS', actionWas: 'CREATE', id: dbres.data.createTest.test.id});
                }
            }
            // the downloads now live on github so this isn't required
            // copy EPUB file to downloads dir
            // let destDir = path.join(__dirname, '../pages/books/');
            // try {
            //     fs.statSync(destDir);
            // }
            // catch(err) {
            //     winston.error(`Could not copy ${testBook.filename} to ${destDir}`);
            // }
            // await fs.copyFile(testBook.path, path.join(destDir, testBook.filename));
        }
    }
    catch(err) {
        await undo(transactions, jwt);
        return { success: false, errors};
    }
    return {success: true, errors: [], newBookId: addBookResult.id};
}

// get the answer sets that use this test book
// differentiate between empty and non-empty answer sets
async function getUsage(testBookId, jwt) {
    let errors = [];
    let answerSets = {};
    try {
        let dbres = await db.query(Q.ANSWER_SETS.GET_FOR_BOOK(),
            {testBookId}, jwt);
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }

        // count empty vs non-empty answer sets
        let nonEmpty = dbres.data.answerSets
            .filter(answerSet => answerSet.answers
                    .filter(ans => ans.value != 'NOANSWER')
                    .length > 0); 
        
        let empty = dbres.data.answerSets.filter(answerSet => !nonEmpty.includes(answerSet));

        answerSets = {
            all: dbres.data.answerSets,
            empty,
            nonEmpty
        };
        
    }
    catch(err) {
        return {success: false, errors: errors.length > 0 ? errors : [err]};
    }
    
    return { success: true, errors, answerSets};
}

// returns bool
async function canRemove(testBookId, jwt) {
    // check if there are any answersets which use this book
    let usage = await getUsage(testBookId, jwt);
    if (!usage.success) {
        return false;
    }
    let numNonEmpty = usage.answerSets?.nonEmpty?.length;
    return  numNonEmpty == 0 ||  numNonEmpty == undefined; 
}

async function remove(testBookId, jwt) {
    let errors = [];
    try {
        let canRemoveBook = await canRemove(testBookId, jwt);
        if (canRemoveBook) {
            let dbres = await db.query(Q.TEST_BOOKS_WITH_TESTS.GET(), {id: parseInt(testBookId)}, jwt);
            
            if (!dbres.success) {
                errors = dbres.errors;
                throw new Error();
            }
            
            // delete tests
            let tests = dbres.data.testBook.tests;
            for (let test of tests) {
                dbres = await db.query(Q.TESTS.DELETE(),  {id: parseInt(test.id)}, jwt);
                if (!dbres.success) {
                    errors = errors.concat(dbres.errors);
                }
            }

            // if some of the tests couldn't be deleted, then don't delete the book
            // or we'll have stray tests floating around
            if (errors.length > 0) {
                errors = dbres.errors;
                throw new Error();
            }
            
            // delete test book
            dbres = await db.query(Q.TEST_BOOKS.DELETE(), 
                {id: parseInt(testBookId)},
                jwt);
            
            if (!dbres.success) {
                errors = dbres.errors;
                throw new Error();
            }
        }
        else {
            throw new Error("Cannot remove book: operation not allowed");
        }
    }
    catch (err) {
        return { success: false, errors: errors.length > 0 ? errors : [err]};   
    }
    return {success: true, errors};
}

// return the latest test book ID for the given topic (and, if specified, given language)
async function getLatestForTopic(topicId, langId='en') {
    let errors = [];
    let book = null;
    try {
        let dbres = await db.query(Q.TEST_BOOKS.GET_LATEST());
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let testBooks = dbres.data.testBooks;
        //let topicId = topic;
        book = testBooks.find(tb => tb.topicId === topicId && tb.langId === langId);

        if (!book) {
            throw new Error(`Could not find book for topic ${topicId} and lang ${langId}`);
        }
    }
    catch (err) {
        return {success: false, errors: errors.length > 0 ? errors : [err], testBook: null};
    }
    return {success: true, errors: [], testBook: book};
}

// return the latest test book ID with its tests, for the given topic (and, if specified, given language)
async function getLatestForTopicWithTests(topicId, langId='en') {
    let errors = [];
    let book = null;
    try {
        let dbres = await db.query(Q.TEST_BOOKS.GET_LATEST());
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let testBooks = dbres.data.testBooks;
        //let topicId = topic;
        book = testBooks.find(tb => tb.topicId === topicId && tb.langId === langId);

        if (!book) {
            throw new Error(`Could not find book for topic ${topicId} and lang ${langId}`);
        }
        dbres = await db.query(Q.TEST_BOOKS_WITH_TESTS.GET(), { id: book.id });
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        book = dbres.data.testBook;
    }
    catch (err) {
        return {success: false, errors: errors.length > 0 ? errors : [err], testBook: null};
    }
    return {success: true, errors: [], testBook: book};
}


export {
    add,
    canAdd,
    setFlags,
    parse,
    remove,
    canRemove,
    getUsage,
    getLatestForTopic,
    getLatestForTopicWithTests
};