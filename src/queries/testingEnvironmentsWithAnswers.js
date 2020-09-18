const generate  = require('./crudGenerator');
const testEnvFrag = require('./fragments/testingEnvironment');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("testingEnvironment", "testingEnvironments", testEnvFrag.FIELDS_WITH_ANSWERS)

// get all public results
const GET_PUBLISHED = `
query {
    getPublishedTestingEnvironments {
        nodes {
            ${testEnvFrag.FIELDS_WITH_ANSWERS}
        }
    }
}`;

// get all archived public results
const GET_ARCHIVED =`
query {
    getArchivedTestingEnvironments {
        nodes {
            ${testEnvFrag.FIELDS_WITH_ANSWERS}
        }
    }
}`;

// get answer sets for a given user
const GET_BY_USER =`
query($userId: Int!) {
    getUserTestingEnvironments(userId: $userId) {
        nodes {
            ${testEnvFrag.FIELDS_WITH_ANSWERS}
        }
    }
}`;

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL, GET_PUBLISHED, GET_ARCHIVED, GET_BY_USER
};

// ARCHIVE: 
//       `mutation ($id: Int!) {
//           updateTestingEnvironment(input:{
//               id: $id,
//               patch: {
//                 isArchived:true
//               }
//             })
//             {
//               clientMutationId
//             }
//         }`,
//     UNARCHIVE: 
//     `mutation ($id: Int!) {
//         updateTestingEnvironment(input:{
//             id: $id,
//             patch: {
//                 isArchived:false
//             }
//             })
//             {
//             clientMutationId
//             }
//     }`,

    // get all public results

  