const answers = require('./answers');
const answerSets = require('./answerSets');
const auth = require('./auth');
const invitations = require('./invitations');
const requests = require('./requests');
const software = require('./software');
const testBooks = require('./testBooks');
const testingEnvironments = require('./testingEnvironments');
const tests = require('./tests');
const topics = require('./topics');
const users = require('./users');

module.exports = {
    ANSWERS: answers,
    ANSWER_SETS: answerSets,
    AUTH: auth,
    INVITATIONS: invitations,
    REQUESTS: requests,
    SOFTWARE: software,
    TEST_BOOKS: testBooks,
    TESTING_ENVIRONMENTS: testingEnvironments,
    TESTS: tests,
    TOPICS: topics,
    USERS: users, 
    ETC: require('./etc')
};