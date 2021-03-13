import generate from './crudGenerator.js';
import * as software from './software.js';
import * as answerSets from './answerSets.js';

const BASIC_FIELDS = () => `
id
os{
    ${software.FIELDS()}
}
readingSystem{
    ${software.FIELDS()}
}
assistiveTechnology{
    ${software.FIELDS()}
}
device{
    ${software.FIELDS()}
}
browser{
    ${software.FIELDS()}
}
input
testedWithBraille
testedWithScreenreader
isArchived
isPublic
notes
`;

const FIELDS = () => `
${BASIC_FIELDS()}
answerSets {
    ${answerSets.FIELDS()}
}`;

const FIELDS_WITH_ANSWERS = () => `
${BASIC_FIELDS()}
answerSets {
    ${answerSets.FIELDS_WITH_ANSWERS()}
}
`;

const FIELDS_WITH_USER_LOGIN = () => `
${BASIC_FIELDS()}
answerSets {
    ${answerSets.FIELDS_WITH_USER_LOGIN()}
}`;

const FIELDS_WITH_ANSWERS_WITH_USER_LOGIN = () => `
${BASIC_FIELDS()}
answerSets {
    ${answerSets.FIELDS_WITH_ANSWERS_WITH_USER_LOGIN()}
}
`;

const PUBLIC_FIELDS = () => `
${BASIC_FIELDS()}
answerSets (condition: {isLatestPublic: true}) {
    ${answerSets.FIELDS()}
}`;

const PUBLIC_FIELDS_WITH_ANSWERS = () => `
${BASIC_FIELDS()}
answerSets (condition: {isLatestPublic: true}) {
    ${answerSets.FIELDS_WITH_ANSWERS()}
}`;

const PUBLIC_FIELDS_WITH_USER_LOGIN = () => `
${BASIC_FIELDS()}
answerSets (condition: {isLatestPublic: true}){
    ${answerSets.FIELDS_WITH_USER_LOGIN()}
}`;

const PUBLIC_FIELDS_WITH_ANSWERS_WITH_USER_LOGIN = () => `
${BASIC_FIELDS()}
answerSets (condition: {isLatestPublic: true}) {
    ${answerSets.FIELDS_WITH_ANSWERS_WITH_USER_LOGIN()}
}
`;

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("testingEnvironment", "testingEnvironments", FIELDS)

const GET_ALL_PUBLISHED = () => `
query {
    testingEnvironments(condition: {isPublic: true, isArchived: false}) {
        ${PUBLIC_FIELDS()}
    }
}`;

// get all archived public results
const GET_ALL_ARCHIVED = () => `
query {
    getArchivedTestingEnvironments {
        ${FIELDS()}
    }
}`;

// get answer sets for a given user
const GET_ALL_BY_USER = () => `
query($userId: Int!) {
    getUserTestingEnvironments(userId: $userId) {
        ${FIELDS()}
    }
}`;

export {
    BASIC_FIELDS, 
    FIELDS, FIELDS_WITH_ANSWERS, FIELDS_WITH_USER_LOGIN, FIELDS_WITH_ANSWERS_WITH_USER_LOGIN,
    PUBLIC_FIELDS, PUBLIC_FIELDS_WITH_ANSWERS, PUBLIC_FIELDS_WITH_USER_LOGIN, PUBLIC_FIELDS_WITH_ANSWERS_WITH_USER_LOGIN,
    CREATE, DELETE, UPDATE, GET, GET_ALL, GET_ALL_PUBLISHED, GET_ALL_ARCHIVED, GET_ALL_BY_USER
};

