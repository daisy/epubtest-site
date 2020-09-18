const path = require("path");
const Q = require("../../src/queries/index");
const db = require("../../src/database");
const testBookActions = require("../../src/actions/testBooks");
const winston = require('winston');

// returns [ { newBookId, replacesBookId}, ...] where replacesBookId is the book that newBookId is upgrading, if any
async function addTestBooks(data, jwt, datafilepath) {
    winston.info("Adding Test Books");
    let addedBooks = [];
    for (testbook of data) {
        // 1. parse 
        let filepath = path.resolve(path.dirname(datafilepath), testbook.file);
        let filename = path.basename(filepath)
        let result = await testBookActions.parse(filepath, filename);
        if (!result.success) {
            winston.error(`Error parsing testbook ${testbook}`);
            return;
        }
        let parsedTestBook = result.testBook;

        // 2. see if we can add it
        let canAdd = await testBookActions.canAdd(parsedTestBook, jwt);

        // 3. add it
        if (!canAdd.success) {
            winston.error(`Cannot add test book ${testbook}`);
            return;
        }

        // new tests are flagged at this point
        let flaggedBook = await testBookActions.setFlags(parsedTestBook, canAdd.bookToUpgrade, jwt);

        // manually set additional flags for changed tests
        for (flag of testbook.flags) {
            flaggedBook.testBook.tests.find(t => t.testId == flag).flagChanged = true;
        }

        // adding the book also creates new answer sets
        result = await testBookActions.add(flaggedBook.testBook, jwt);
        addedBooks.push({newBookId: result.newBookId, replacesBookId: canAdd?.bookToUpgrade?.id});
    } 
    return addedBooks;
}

module.exports = addTestBooks;