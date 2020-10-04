const Q = require("../../src/queries/index");
const db = require("../../src/database");
const winston = require("winston");

async function updateAnswersAndPublish(data, jwt, publish, errors) {
    winston.info("Updating answers");
    if (publish) {
        winston.info("and publishing");
    }

    let dbres = await db.query(Q.TESTING_ENVIRONMENTS.GET_ALL, {}, jwt);
    let tenvs = dbres.data.testingEnvironments;
    dbres = await db.query(Q.TEST_BOOKS.GET_LATEST, {}, jwt);
    let testBooks = dbres.data.getLatestTestBooks;

    for (answerSetJson of data) {
        // get the testing environment ID and test book ID
        let testingEnvironmentId = tenvs.find(tenv => tenv.readingSystem.name === answerSetJson.readingSystemName).id;
        let testBookId = testBooks.find(tb => tb.topicId === answerSetJson.testBookTopic).id;

        // find the answer set
        dbres = await db.query(
            Q.ANSWER_SETS.GET_FOR_BOOK_AND_TESTING_ENVIRONMENT, 
            {
                testBookId,
                testingEnvironmentId
            }, 
            jwt);
        //let dbres = await db.query(Q.ANSWER_SETS.GET, {id: answerSetJson.answerSetId}, jwt);
        if (!dbres.success) {
            errors = errors.concat(dbres.errors);
            throw new Error("updateAnswersAndPublish error");
        }
        let answerSet = dbres.data.answerSets[0];
        let summary = answerSetJson.summary ?? "";
        let answerIds = answerSetJson.answers.map(answer => {
            let answerInDb = answerSet.answers.find(ans => ans.test.testId == answer.testId);
            if (answerInDb) {
                return answerInDb.id;
            }
            else {
                winston.error(`Answer for test id ${answer.testId} not found`);
            }
        });
            
        let answerValues = answerSetJson.answers.map(answer => answer.result);
        let notes = answerSetJson.answers.map(answer => answer.notes ?? "");
        let notesArePublic = answerSetJson.answers.map(answer => answer.notesArePublic ?? false);
        dbres = await db.query(
            Q.ANSWER_SETS.UPDATE_ANSWERSET_AND_ANSWERS, 
            {
                input: 
                {
                    answerSetId: answerSet.id,
                    summary,
                    answerIds,
                    answerValues,
                    notes,
                    notesArePublic
                }
            }, 
            jwt);
        if (!dbres.success) {
            errors = errors.concat(dbres.errors);
            throw new Error("updateAnswersAndPublish error");
        }
        if (publish) {
            dbres = await db.query(Q.ANSWER_SETS.UPDATE, { id: answerSet.id, patch: {isPublic: true}}, jwt);
            if (!dbres.success) {
                errors = errors.concat(dbres.errors);
                throw new Error("updateAnswersAndPublish error");
            }
        }
        
    }
}

module.exports = updateAnswersAndPublish;