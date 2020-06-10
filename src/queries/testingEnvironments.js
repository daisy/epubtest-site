const fragments = require('./fragments');

module.exports = {

    GET_ALL: 
    `query {
        testingEnvironments {
            nodes {
                ${fragments.TESTING_ENVIRONMENT_FIELDS}
                answerSetsByTestingEnvironmentId {
                    nodes {
                        ${fragments.ANSWERSET_FIELDS}
                        user {
                            ${fragments.USER_FIELDS}
                        }
                        testBook {
                            ${fragments.TEST_BOOK_FIELDS}
                        }
                    }
                }
            }
        }
    }`,

    ARCHIVE: 
      `mutation ($id: Int!) {
          updateTestingEnvironment(input:{
              id: $id,
              patch: {
                isArchived:true
              }
            })
            {
              clientMutationId
            }
        }`,
    UNARCHIVE: 
    `mutation ($id: Int!) {
        updateTestingEnvironment(input:{
            id: $id,
            patch: {
                isArchived:false
            }
            })
            {
            clientMutationId
            }
    }`,

    ADD: 
    `mutation ($newTestingEnvironmentInput: CreateTestingEnvironmentInput!) {
        createTestingEnvironment(input: $newTestingEnvironmentInput) {
            clientMutationId
            testingEnvironment {
                id
            }
        }
    }`,

    DELETE: 
    `mutation ($id: Int!) {
        deleteTestingEnvironment(input:{ id:$id}) {
          clientMutationId
        }
    }`,
    
    // get all public results
    GET_PUBLISHED: 
    `query {
        getPublishedTestingEnvironments {
            nodes {
                ${fragments.TESTING_ENVIRONMENT_FIELDS}
                answerSetsByTestingEnvironmentId {
                    nodes {
                        ${fragments.ANSWERSET_FIELDS}
                        user {
                            ${fragments.USER_FIELDS}
                        }
                        testBook {
                            ${fragments.TEST_BOOK_FIELDS}  
                        }
                    }
                }
            }
        }
    }`,

    // get all archived public results
    GET_ARCHIVED: 
    `query {
        getArchivedTestingEnvironments {
            nodes {
                ${fragments.TESTING_ENVIRONMENT_FIELDS}
                answerSetsByTestingEnvironmentId {
                    nodes {
                        ${fragments.ANSWERSET_FIELDS}
                        user {
                            ${fragments.USER_FIELDS}
                        }
                        testBook {
                            ${fragments.TEST_BOOK_FIELDS}  
                        }
                    }
                }
            }
        }
    }`,

    // get a single testing environment with its results
    GET_BY_ID: 
    `query($id: Int!) {
        testingEnvironment(id: $id) {
            id
            ${fragments.TESTING_ENVIRONMENT_FIELDS}
            answerSetsByTestingEnvironmentId {
                nodes {
                    ${fragments.ANSWERSET_FIELDS}
                    user {
                        ${fragments.USER_FIELDS}
                    }
                    testBook {
                        ${fragments.TEST_BOOK_FIELDS}
                    }
                    answersByAnswerSetId {
                        nodes {
                            ${fragments.ANSWER_FIELDS}
                        }
                    }
                }
            }
        }
    }`,

    // get answer sets for a given user
    GET_BY_USER: 
    `query($userId: Int!) {
        getUserTestingEnvironments(userId: $userId) {
            nodes {
                ${fragments.TESTING_ENVIRONMENT_FIELDS}
                answerSetsByTestingEnvironmentId(
                    condition: { 
                        userId: $userId 
                    }) {
                    nodes{
                        ${fragments.ANSWERSET_FIELDS}
                        testBook {
                            ${fragments.TEST_BOOK_FIELDS}
                        }
                    }
                }
            }
        }
     }`,
};