const generate  = require('./crudGenerator');
const testEnvFrag = require('./fragments/testingEnvironment');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("testingEnvironment", "testingEnvironments", testEnvFrag.FIELDS_WITH_ANSWERS)

const {GET: GET_PUBLISHED}
    = generate("testingEnvironment", "testingEnvironments", testEnvFrag.PUBLIC_FIELDS_WITH_ANSWERS);

// get all public results
// const GET_ALL_PUBLISHED = `
// query {
//     getPublishedTestingEnvironments {
//         nodes {
//             ${testEnvFrag.PUBLIC_FIELDS_WITH_ANSWERS}
//         }
//     }
// }`;
const GET_ALL_PUBLISHED = `
query {
    testingEnvironments(condition: {isPublic: true}) {
        nodes {
            ${testEnvFrag.PUBLIC_FIELDS_WITH_ANSWERS}
        }
    }
}`;

// get all archived public results
const GET_ALL_ARCHIVED =`
query {
    getArchivedTestingEnvironments {
        nodes {
            ${testEnvFrag.FIELDS_WITH_ANSWERS}
        }
    }
}`;

// get answer sets for a given user
const GET_ALL_BY_USER =`
query($userId: Int!) {
    getUserTestingEnvironments(userId: $userId) {
        nodes {
            ${testEnvFrag.FIELDS_WITH_ANSWERS}
        }
    }
}`;

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_PUBLISHED, GET_ALL, GET_ALL_PUBLISHED, GET_ALL_ARCHIVED, GET_ALL_BY_USER};
