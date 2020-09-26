const answerFrag = require("./answer");
const testBookFrag = require("./testBook");
const userFrag = require('./user');

const BASIC_FIELDS = `
id
summary
flag
score
isPublic
isLatest
isLatestPublic
testBook {
    ${testBookFrag.FIELDS}
}
`;

const FIELDS = `
${BASIC_FIELDS}
user {
    ${userFrag.FIELDS}
}`;

const FIELDS_WITH_USER_LOGIN = `
${BASIC_FIELDS}
user {
    ${userFrag.FIELDS_WITH_LOGIN}
}
`;

const FIELDS_WITH_ANSWERS = `
${FIELDS}
answersByAnswerSetId {
    nodes {
        ${answerFrag.FIELDS}
    }
}
`;

const FIELDS_WITH_ANSWERS_WITH_USER_LOGIN = `
${FIELDS_WITH_USER_LOGIN}
answersByAnswerSetId {
    nodes {
        ${answerFrag.FIELDS}
    }
}
`;


module.exports = { FIELDS, FIELDS_WITH_ANSWERS, FIELDS_WITH_USER_LOGIN, FIELDS_WITH_ANSWERS_WITH_USER_LOGIN };