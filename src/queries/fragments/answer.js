const testFrag = require('./test');

const FIELDS = `
id
test {
    ${testFrag.FIELDS}
}
value
flag
notes
notesArePublic
`;

module.exports = { FIELDS };