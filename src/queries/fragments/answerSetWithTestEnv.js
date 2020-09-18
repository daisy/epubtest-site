const answerSetFrag = require("./answerSet");
const testEnvFrag = require("./testingEnvironment");

const FIELDS = `
${answerSetFrag.FIELDS}
testingEnvironment {
    ${testEnvFrag.FIELDS}
}
`;

const FIELDS_WITH_USER_LOGIN = `
${answerSetFrag.FIELDS_WITH_USER_LOGIN}
testingEnvironment {
    ${testEnvFrag.FIELDS}
}`;

const FIELDS_WITH_ANSWERS = `
${answerSetFrag.FIELDS_WITH_ANSWERS}
testingEnvironment {
    ${testEnvFrag.FIELDS}
}
`;

const FIELDS_WITH_ANSWERS_WITH_USER_LOGIN = `
${answerSetFrag.FIELDS_WITH_ANSWERS_WITH_USER_LOGIN}
testingEnvironment {
    ${testEnvFrag.FIELDS}
}`;

module.exports = { FIELDS, FIELDS_WITH_ANSWERS, FIELDS_WITH_USER_LOGIN, FIELDS_WITH_ANSWERS_WITH_USER_LOGIN };