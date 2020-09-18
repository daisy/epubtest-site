const answerSetFrag = require('./answerSetWithTestEnv');

const FIELDS = `
id
created
answerSet {
    ${answerSetFrag.FIELDS}
}`;

module.exports = { FIELDS };