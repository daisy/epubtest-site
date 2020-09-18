const userFrag = require('./user');

const FIELDS = `
id
user {
    ${userFrag.FIELDS_WITH_LOGIN}
}
dateInvited
`;

module.exports = { FIELDS };