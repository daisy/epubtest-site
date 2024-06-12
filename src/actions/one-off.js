import * as db from '../database/index.js';
import * as Q from '../queries/index.js';

// for migrated answer sets, copy the notes field too
async function copyNotesField(jwt) {

    // get all the answer sets that were copied from another answer set
    let dbres = await db.query(Q.ANSWER_SETS.GET_ALL(), {}, jwt);
        
    if (!dbres.success) {
        let err = new Error("Could not get answer sets.");
        return err;
    }

    let answerSets = dbres.data.answerSets.filter(aset => aset.createdFrom != null);

    for (let answerSet of answerSets) {
        let dbres = await db.query(Q.ANSWER_SETS.GET(), {id: answerSet.createdFrom.id}, jwt);
        
        if (!dbres.success) {
            let err = new Error("Could not get answer set.");
            return err;
        }
        let sourceAnswerSet = dbres.data.answerSet;

        // copy the notes field over
        for (let answer of answerSet.answers) {
            let sourceAnswer = sourceAnswerSet.answers.find(a => a.test.testId == answer.test.testId);
            if ((!answer.notes || answer.notes == '') && sourceAnswer) {
                dbres = await db.query(
                    Q.ANSWERS.UPDATE(), 
                    {
                        id: answer.id,
                        patch: {
                            notes: sourceAnswer.notes,
                            notesArePublic: sourceAnswer.notesArePublic
                        }
                    },
                    jwt
                );
                if (!dbres.success) {
                    console.log("Error updating answer notes", dbres.errors);
                }
            }
        }
    }
    return true;
}

export { copyNotesField };

/*
e.g. 
http://localhost:8000/user/edit-results/4452
should get its notes from
http://localhost:8000/user/edit-results/820
*/