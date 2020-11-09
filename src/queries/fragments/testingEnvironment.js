const softwareFrag = require('./software');
const answerSetFrag = require('./answerSet');

const BASIC_FIELDS = `
id
os{
    ${softwareFrag.FIELDS}
}
readingSystem{
    ${softwareFrag.FIELDS}
}
assistiveTechnology{
    ${softwareFrag.FIELDS}
}
device{
    ${softwareFrag.FIELDS}
}
browser{
    ${softwareFrag.FIELDS}
}
input
testedWithBraille
testedWithScreenreader
isArchived
isPublic
notes
`;
const FIELDS = `
${BASIC_FIELDS}
answerSets {
    ${answerSetFrag.FIELDS}
}`;

const FIELDS_WITH_ANSWERS = `
${BASIC_FIELDS}
answerSets {
    ${answerSetFrag.FIELDS_WITH_ANSWERS}
}
`;

const FIELDS_WITH_USER_LOGIN = `
${BASIC_FIELDS}
answerSets {
    ${answerSetFrag.FIELDS_WITH_USER_LOGIN}
}`;

const FIELDS_WITH_ANSWERS_WITH_USER_LOGIN = `
${BASIC_FIELDS}
answerSets {
    ${answerSetFrag.FIELDS_WITH_ANSWERS_WITH_USER_LOGIN}
}
`;

const PUBLIC_FIELDS = `
${BASIC_FIELDS}
answerSets (condition: {isLatestPublic: true}) {
    ${answerSetFrag.FIELDS}
}`;

const PUBLIC_FIELDS_WITH_ANSWERS = `
${BASIC_FIELDS}
answerSets (condition: {isLatestPublic: true}) {
    ${answerSetFrag.FIELDS_WITH_ANSWERS}
}`;

const PUBLIC_FIELDS_WITH_USER_LOGIN = `
${BASIC_FIELDS}
answerSets (condition: {isLatestPublic: true}){
    ${answerSetFrag.FIELDS_WITH_USER_LOGIN}
}`;

const PUBLIC_FIELDS_WITH_ANSWERS_WITH_USER_LOGIN = `
${BASIC_FIELDS}
answerSets (condition: {isLatestPublic: true}) {
    ${answerSetFrag.FIELDS_WITH_ANSWERS_WITH_USER_LOGIN}
}
`;

module.exports = { FIELDS, FIELDS_WITH_ANSWERS, FIELDS_WITH_USER_LOGIN, FIELDS_WITH_ANSWERS_WITH_USER_LOGIN,
PUBLIC_FIELDS, PUBLIC_FIELDS_WITH_ANSWERS, PUBLIC_FIELDS_WITH_USER_LOGIN, PUBLIC_FIELDS_WITH_ANSWERS_WITH_USER_LOGIN };
