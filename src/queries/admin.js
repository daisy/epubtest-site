module.exports = {
    // get all the requests for publishing
    REQUESTS: 
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
                }
                assistiveTechnology {
                  name
                  version
                }
                os {
                  name
                  version
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
    
    ALL_TESTING_ENVIRONMENTS: 
    `query {
        testingEnvironments {
            nodes {
                id
                isArchived
                readingSystem {
                    name
                    version
                }
                assistiveTechnology{
                    name
                    version
                }
                os {
                    name
                    version
                }
                device {
                    name
                    version
                }
                browser {
                    name
                    version
                }
                answerSetsByTestingEnvironmentId {
                    nodes {
                        id
                        flag
                        score
                        isPublic
                        testBook {
                            title
                            topic {
                                id
                            }
                            lang {
                                id
                                label
                            }
                        }
                    }
                }
            }
        }
    }`,

    INACTIVE_USERS: 
    `query {
        getInactiveUsers {
            nodes {
                id
                name
                email
            }
        }
    }`,

    ACTIVE_USERS: 
    `query {
        getActiveUsers {
            nodes {
                id
                name
            }
        }
    }`,

    INVITATIONS: 
    `query {
        invitations {
            nodes {
                user {
                    id
                    name
                }
                dateInvited
            }
        }
    }`,

    PUBLISH_ANSWER_SET: 
    `mutation ($answerSetId: Int!) {
        updateAnswerSet(input:{
            id: $answerSetId,
            patch: {
              isPublic:true
            }
          })
          {
            clientMutationId
          }
      }`,

      UNPUBLISH_ANSWER_SET: 
      `mutation ($answerSetId: Int!) {
          updateAnswerSet(input:{
              id: $answerSetId,
              patch: {
                isPublic:false
              }
            })
            {
              clientMutationId
            }
        }`,
  

    DELETE_REQUEST: 
    `mutation ($requestId: Int!) {
        deleteRequest(input:{
            id: $requestId
        }){
            clientMutationId
        }
    }`,

    CREATE_INVITATION: 
    `mutation ($input: CreateInvitationInput!) {
        createInvitation(input: $input) {
            clientMutationId
        }
    }`,

    ARCHIVE_TESTING_ENVIRONMENT: 
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
    UNARCHIVE_TESTING_ENVIRONMENT: 
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

}