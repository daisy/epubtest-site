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
    
    ALL_TESTING_ENVIRONMENTS: 
    `query {
        testingEnvironments {
            nodes {
                id
                isArchived
                readingSystem {
                    name
                    version
                    vendor
                }
                assistiveTechnology{
                    name
                    version
                    vendor
                }
                os {
                    name
                    version
                    vendor
                }
                device {
                    name
                    version
                    vendor
                }
                browser {
                    name
                    version
                    vendor
                }
                answerSetsByTestingEnvironmentId {
                    nodes {
                        id
                        flag
                        score
                        isPublic
                        user {
                            id
                            name
                            organization
                            website
                            includeCredit
                            creditAs
                        }
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

    ADD_TEST_BOOK: 
    `mutation ($topicId: String!, $langId: String!, $version: String!, $title: String!, $filename: String!, $description: String) {
        createTestBook(input:{
            testBook:{
              topicId: $topicId
              title: $title
              langId: $langId
              version: $version
              filename: $filename
              description: $description
            }
          }){
            clientMutationId
            testBook {
                id
            }
          }
    }`,

    ADD_TEST:
    `mutation ($testId: String!, $testBookId: Int!, $name: String!, $description: String, $xhtml: String!, $order: Int!, $flag: Boolean) {
        createTest(input:{
            test:{
                testId: $testId
                testBookId: $testBookId
                name: $name
                description: $description
                xhtml: $xhtml
                order: $order
                flag: $flag
            }
        }) {
            clientMutationId
        }
    }`,    
    
    READING_SYSTEMS: 
    `query {
        softwares(condition: {type: READING_SYSTEM}) {
            nodes{
                id
                name
            	version
            	vendor
            }
        }
    }`,

    ASSISTIVE_TECHNOLOGIES:
    `query {
        softwares(condition: {type: ASSISTIVE_TECHNOLOGY}) {
            nodes{
                id
                name
            	version
            	vendor
            }
        }
    }`,

    OPERATING_SYSTEMS:
    `query {
        softwares(condition: {type: OS}) {
            nodes{
                id
                name
            	version
            	vendor
            }
        }
    }`,

    BROWSERS:
    `query {
        softwares(condition: {type: BROWSER}) {
            nodes{
                id
                name
            	version
            	vendor
            }
        }
    }`,

    ADD_SOFTWARE:
    `mutation ($newSoftwareInput: CreateSoftwareInput!) {
        createSoftware(input:$newSoftwareInput) {
            clientMutationId
        }
    }`,

    ADD_TESTING_ENVIRONMENT: 
    `mutation ($newTestingEnvironmentInput: CreateTestingEnvironmentInput!) {
        createTestingEnvironment(input: $newTestingEnvironmentInput) {
            clientMutationId
            testingEnvironment {
                id
            }
        }
    }`,

    ADD_ANSWER_SET: 
    `mutation ($newAnswerSetInput: CreateAnswerSetInput!) {
        createAnswerSet(input: $newAnswerSetInput) {
            clientMutationId
            answerSet {
                id
            }
        }
    }`,

    ADD_ANSWER: 
    `mutation ($newAnswerInput: CreateAnswerInput!) {
        createAnswer(input: $newAnswerInput) {
            clientMutationId
            answer {
                id
            }
        }
    }`,

    DELETE_TESTING_ENVIRONMENT: 
    `mutation ($id: Int!) {
        deleteTestingEnvironment(input:{ id:$id}) {
          clientMutationId
        }
    }`,

    DELETE_ANSWER: 
    `mutation ($id:Int!) {
        deleteAnswer(input:{id:$id}) {
            clientMutationId
        }
    }`,

    DELETE_ANSWER_SET:
    `mutation ($id:Int!) {
        deleteAnswerSet(input:{id:$id}) {
            clientMutationId
        }
    }`
}