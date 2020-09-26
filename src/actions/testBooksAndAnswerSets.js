const db = require('../database');
const Q = require('../queries');
const testBooks = require('./testBooks');
const answerSets = require('./answerSets');

// remove answer sets and test book for the given test book id
async function remove(testBookId, jwt) {
    let errors = [];
    try {
        let usageResult = await testBooks.getUsage(testBookId, jwt);
        if (!usageResult.success) {
            errors = usageResult.errors;
            throw new Error();
        }
        for (answerSet of usageResult.answerSets.all) {
            let answerSetResult = await answerSets.remove(answerSet.id, jwt);
            if (!answerSetResult.success) {
                errors = answerSetResult.errors;
                throw new Error();
            }
        }
        let result = await testBooks.remove(testBookId, jwt);
        if (!result.success) {
            errors = result.errors;
            throw new Error();
        }
    }
    catch(err) {
        return { success: false, errors: errors.length > 0 ? errors : [err] };
    }
    return { success: true, errors };
}

module.exports = {
    remove
};