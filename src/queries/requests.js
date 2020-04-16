module.exports = {
    // get all the requests for publishing
    GET_ALL: 
    `query{
        requests {
        nodes {
            id
            created
            answerSet{
            id
            score
            testingEnvironment {
                readingSystem {
                name
                version
                vendor
                }
                assistiveTechnology {
                name
                version
                vendor
                }
                os {
                name
                version
                vendor
                }
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