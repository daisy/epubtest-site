const fragments = require('./fragments');

module.exports = {
    // get all the requests for publishing
    GET_ALL: 
    `query{
        requests {
            nodes {
                id
                created
                answerSet {
                    id
                    score
                    testingEnvironment {
                        ${fragments.TESTING_ENVIRONMENT_FIELDS}
                    }
                    user {
                        name
                    }
                    testBook {
                        topic {
                            id
                        }
                    }
                }
            }
        }
    }`,

    DELETE: 
    `mutation ($requestId: Int!) {
        deleteRequest(input:{
            id: $requestId
        }){
            clientMutationId
        }
    }`,

    ADD: 
    `mutation ($answerSetId: Int!) {
        createRequest(input:{
            request: {
                type: PUBLISH,
                answerSetId: $answerSetId
            }
        }) {
            clientMutationId
        }
      }`,

    // get requests for publishing for the given answer sets
    GET_FOR_ANSWERSETS: 
    `query($ids: [Int!]) {
        requests(filter:{answerSetId:{in: $ids}}) {
            nodes {
                id
                type
                answerSetId
                created
            }
        }
    }`,

    
    
};