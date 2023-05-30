import generate from './crudGenerator.js';
import * as testEnvs from './testingEnvironments.js';
import * as answerSets from './answerSets.js';

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("testingEnvironment", "testingEnvironments", testEnvs.FIELDS_WITH_ANSWERS)

const {GET: GET_PUBLISHED}
    = generate("testingEnvironment", "testingEnvironments", testEnvs.PUBLIC_FIELDS_WITH_ANSWERS);

const GET_ALL_PUBLISHED = () => `
query {
    testingEnvironments(condition: {isPublic: true}) {
        ${testEnvs.PUBLIC_FIELDS_WITH_ANSWERS()}
    }
}`;

// get all archived public results
const GET_ALL_ARCHIVED = () => `
query {
    getArchivedTestingEnvironments {
        ${testEnvs.FIELDS_WITH_ANSWERS()}
    }
}`;

// get answer sets for a given user
const GET_ALL_BY_USER = () => `
query($userId: Int!) {
    getUserTestingEnvironments(userId: $userId) {
        ${testEnvs.FIELDS_WITH_ANSWERS()}
    }
}`;

// get each testing environment's latest answer public answer set for test books in a topic (each topic has one test book but there can be many versions)
// also get all the answers
const GET_ALL_BY_TESTBOOKS = () => `
query($testBookIds: [Int!]) {
    testingEnvironments(condition: {isPublic: true, isArchived: false}) {
        ${testEnvs.BASIC_FIELDS()}
        answerSets (condition: {isLatestPublic: true}, filter: { testBookId: {in: $testBookIds} } ) {
            ${answerSets.FIELDS_WITH_ANSWERS()}
        }
    }
}`;

export {
    CREATE, DELETE, UPDATE, GET, GET_PUBLISHED, GET_ALL, GET_ALL_PUBLISHED, GET_ALL_ARCHIVED, GET_ALL_BY_USER, GET_ALL_BY_TESTBOOKS};
