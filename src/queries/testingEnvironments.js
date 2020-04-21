module.exports = {

    GET_ALL: 
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
                id
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
    GET_ARCHIVED: 
    `query {
        getArchivedTestingEnvironments {
            nodes {
                id
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

    // get a single testing environment with its results
    GET_BY_ID: 
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
            browser {
                name
                version
                vendor
            }
            device {
                name
                version
                vendor
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
                            id
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

    // get answer sets for a given user
    GET_BY_USER: 
    `query($userId: Int!) {
        getUserTestingEnvironments(userId: $userId) {
            nodes {
            id
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
};