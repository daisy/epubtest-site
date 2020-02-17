module.exports = {

    // get the profile for a given user
    USER_PROFILE: 
    `query($id: Int!) {
        user (id: $id) {
            name
            organization
            website
            includeCredit
            creditAs
        }
    }`,

    USER_EMAIL: 
    `query($id: Int!) {
        user (id: $id) {
            login{
                email
            }
        }
    }`,

    // get answer sets for a given user
    USER_ANSWERSETS: 
    `query($userId: Int!) {
        getUserTestingEnvironments(userId: $userId) {
            nodes {
            id
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
            device {
                name
                version
            }
            browser {
                name
                version
            }
            answerSetsByTestingEnvironmentId(
                condition: { 
                    userId: $userId 
                }) {
                    nodes{
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

    // get all the latest test books
    TEST_BOOKS: 
    `query {
        getLatestTestBooks{
            nodes{
                id
                title
                topicId
                langId 
                version
                filename
                description
            }
        }
    }`,

    // get all public results
    PUBLIC_RESULTS: 
    `query {
        getPublishedTestingEnvironments {
            nodes {
                id
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
                        score
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
                                order
                                type
                            }  
                        }
                    }
                }
            }
        }
    }`,

    // get all archived public results
    ARCHIVED_RESULTS: 
    `query {
        getArchivedTestingEnvironments {
            nodes {
                id
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
                        score
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
                                order
                                type
                            }  
                        }
                    }
                }
            }
        }
    }`,

    // get all topics, in order
    TOPICS: 
    `query {
        topics(orderBy:ORDER_ASC) {
            nodes {
                id
                order
                type
            }
        }
    }`,

    // get a single testing environment with its results
    TESTING_ENVIRONMENT: 
    `query($id: Int!) {
        testingEnvironment(id: $id) {
            id
            testedWithBraille
            testedWithScreenreader
            input
            isArchived
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
            browser {
                name
                version
            }
            device {
                name
                version
            }
            answerSetsByTestingEnvironmentId {
                nodes {
                    id
                    score
                    summary
                    flag
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
                        filename
                        topic {
                            id
                            order
                            type
                        }  
                        lang {
                            id
                            label
                        }
                        version
                    }
                    answersByAnswerSetId {
                        nodes {
                            test {
                                testId
                                description
                                name
                            }
                            value
                            flag
                            notes
                            notesArePublic
                        }
                    }
                }
            }
        }
    }`,

    // get requests for publishing for the given answer sets
    REQUESTS_FOR_ANSWERSETS: 
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

    // get an answer set by ID
    ANSWER_SET: 
    `query($id: Int!) {
        answerSet(id: $id) {
            id
            summary
            userId
            flag
            score
            testingEnvironment {
                id
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
                device {
                    name
                    version
                }
                browser {
                    name
                    version
                }
            }
            testBook {
                title
                version
                lang {
                    id
                    label
                }
                topic {
                    id
                }
            }
            answersByAnswerSetId {
                nodes {
                    id
                    test {
                        id
                        testId
                        description
                        name
                    }
                    value
                    flag
                    notes
                    notesArePublic
                }
            }
        }
    }`,


    UPDATE_USER_PROFILE: 
    `mutation ($id: Int!, $data: UserPatch!) {
        updateUser(input: {
            id: $id,
            patch: $data
        }) {
            clientMutationId
        }
    }`,

    UPDATE_ANSWER_SET: 
    `mutation ($input: UpdateAnswersetAndAnswersInput!) {
        updateAnswersetAndAnswers(input: $input){
            clientMutationId
        }
    }`,

    CREATE_REQUEST: 
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
    
    TESTS_IN_BOOK: 
    `query ($testBookId: Int!) {
        tests (condition: {testBookId: $testBookId}) {
          nodes {
            id
            testId
            name
            description
          }
        }
      }`,

    GET_TEST_BOOK_ID_BY_EPUBID:
    `query ($epubId: String!) {
        testBooks(condition:{
            epubId: $epubId
          }) {
            nodes{
              id
            }
          }
        }`
};
