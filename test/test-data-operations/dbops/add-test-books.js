import * as path from 'path';
import winston from 'winston';
import * as testBookActions from "../../../src/actions/testBooks.js";


// returns [ { newBookId, replacesBookId}, ...] where replacesBookId is the book that newBookId is upgrading, if any
async function addTestBooks(data, jwt, datafilepath, errmgr) {
    winston.info("Adding Test Books");
    let addedBooks = [];
    for (let testbook of data) {
        // 1. parse 
        let filepath = path.resolve(path.dirname(datafilepath), testbook.file);
        let filename = path.basename(filepath)
        let result = await testBookActions.parse(filepath, filename);
        if (!result.success) {
            winston.error(`Error parsing testbook ${testbook}`);
            errmgr.addErrors(result.errors);
            throw new Error("addTestBooks error");
        }
        let parsedTestBook = result.testBook;
        
        // 2. see if we can add it
        let canAdd = await testBookActions.canAdd(parsedTestBook, jwt);

        if (!canAdd.success) {
            winston.error(`Cannot add test book ${testbook}`);
            errmgr.addErrors(dbres.errors);
            throw new Error("addTestBooks error");
        }

        // new tests are flagged at this point
        result = await testBookActions.setFlags(parsedTestBook, canAdd.bookToUpgrade, jwt);
        if (!result.success) {
            errmgr.addErrors(result.errors);
            throw new Error("addTestBooks error");
        }
        let flaggedBook = result.testBook;

        // manually set additional flags for changed tests
        for (let flag of testbook.flags) {
            flaggedBook.tests.find(t => t.testId == flag).flagChanged = true;
        }

        // adding the book also creates new answer sets
        result = await testBookActions.add(flaggedBook, jwt);
        if (!result.success) {
            errmgr.addErrors(result.errors);
            throw new Error("addTestBooks error");
        }
        addedBooks.push({newBookId: result.newBookId, replacesBookId: canAdd?.bookToUpgrade?.id});
    } 
    return addedBooks;
}

export { addTestBooks };