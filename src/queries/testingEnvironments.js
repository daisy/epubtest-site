const generate  = require('./crudGenerator');
const testEnvFrag = require('./fragments/testingEnvironment');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("testingEnvironment", "testingEnvironments", testEnvFrag.FIELDS)

// get all public results
const GET_PUBLISHED = `
query {
    getPublishedTestingEnvironments {
        nodes {
            ${testEnvFrag.FIELDS}
        }
    }
}`;

// get all archived public results
const GET_ARCHIVED =`
query {
    getArchivedTestingEnvironments {
        nodes {
            ${testEnvFrag.FIELDS}
        }
    }
}`;

// get answer sets for a given user
const GET_BY_USER =`
query($userId: Int!) {
    getUserTestingEnvironments(userId: $userId) {
        nodes {
            ${testEnvFrag.FIELDS}
        }
    }
}`;

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL, GET_PUBLISHED, GET_ARCHIVED, GET_BY_USER
};

