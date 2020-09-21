const Q = require("../../src/queries/index");
const db = require("../../src/database");
const winston = require("winston");

async function updateAnswersAndPublish(data, jwt, publish = true) {
    winston.info("Updating answers");
    if (publish) {
        winston.info("and publishing");
    }

    for (answerSetJson of data) {
        // find the answer set
        let dbres = await db.query(
            Q.ANSWER_SETS.GET_FOR_BOOK_AND_TESTING_ENVIRONMENT, 
            {
                testBookId: answerSetJson.testBookId,
                testingEnvironmentId: answerSetJson.testingEnvironmentId
            }, 
            jwt);
        //let dbres = await db.query(Q.ANSWER_SETS.GET, {id: answerSetJson.answerSetId}, jwt);
        if (!dbres.success) {
            return;
        }   
        let answerSet = dbres.data.answerSets.nodes[0];
        let summary = answerSetJson.summary ?? "";
        let answerIds = answerSetJson.answers.map(answer => {
            let answerInDb = answerSet.answersByAnswerSetId.nodes.find(ans => ans.test.testId == answer.testId);
            if (answerInDb) {
                return answerInDb.id;
            }
            else {
                winston.error(`Answer for test id ${answer.testId} not found`);
                return "";
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
        if (publish) {
            dbres = await db.query(Q.ANSWER_SETS.UPDATE, { id: answerSet.id, patch: {isPublic: true}}, jwt);
        }
        
    }
}

module.exports = updateAnswersAndPublish;