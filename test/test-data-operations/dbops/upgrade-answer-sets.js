import winston from 'winston';
import * as answerSetsActions from '../../../src/actions/answerSets.js';

async function upgradeAnswerSets(newBookId, replacesBookId, jwt, errors) {
    winston.info("Upgrading Answer sets");

    let result = await answerSetsActions.upgrade(newBookId, replacesBookId, jwt);

    if (!result.success) {
        for (let err in result.errors) {
            winston.error(err);
        }
        errors = errors.concat(result.errors);
        throw new Error("upgradeAnswerSets error");
    }
}

export { upgradeAnswerSets };
