import generate from './crudGenerator.js';
import * as testEnvs from './testingEnvironments.js';

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
    }
}`;

export {
    CREATE, DELETE, UPDATE, GET, GET_PUBLISHED, GET_ALL, GET_ALL_PUBLISHED, GET_ALL_ARCHIVED, GET_ALL_BY_USER};
