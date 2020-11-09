const userFrag = require('./user');

const FIELDS = `
id
userId
dateInvited
`;

const FIELDS_WITH_LOGIN = `
id
user {
    ${userFrag.FIELDS_WITH_LOGIN}
}
dateInvited
`;

module.exports = { FIELDS, FIELDS_WITH_LOGIN };