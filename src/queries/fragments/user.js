const FIELDS = `
id
name
organization
website
includeCredit
creditAs`;

const FIELDS_WITH_LOGIN = `
${FIELDS}
login {
    type
    lastSeen
    active
}
`;

module.exports = { FIELDS, FIELDS_WITH_LOGIN };