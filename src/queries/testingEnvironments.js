const generate  = require('./crudGenerator');
const testEnvFrag = require('./fragments/testingEnvironment');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("testingEnvironment", "testingEnvironments", testEnvFrag.FIELDS)

// get all public results
// const GET_ALL_PUBLISHED = `
// query {
//     getPublishedTestingEnvironments {
//         nodes {
//             ${testEnvFrag.PUBLIC_FIELDS}
//         }
//     }
// }`;
const GET_ALL_PUBLISHED = `
query {
    testingEnvironments(condition: {isPublic: true}) {
        nodes {
            ${testEnvFrag.PUBLIC_FIELDS}
        }
    }
}`;

// get all archived public results
const GET_ALL_ARCHIVED =`
query {
    getArchivedTestingEnvironments {
        nodes {
            ${testEnvFrag.FIELDS}
        }
    }
}`;

// get answer sets for a given user
const GET_ALL_BY_USER =`
query($userId: Int!) {
    getUserTestingEnvironments(userId: $userId) {
        nodes {
            ${testEnvFrag.FIELDS}
        }
    }
}`;

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL, GET_ALL_PUBLISHED, GET_ALL_ARCHIVED, GET_ALL_BY_USER
};

