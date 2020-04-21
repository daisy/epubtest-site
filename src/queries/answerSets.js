module.exports = {
    ADD: 
    `mutation ($newAnswerSetInput: CreateAnswerSetInput!) {
        createAnswerSet(input: $newAnswerSetInput) {
            clientMutationId
            answerSet {
                id
            }
        }
    }`,

    DELETE:
    `mutation ($id:Int!) {
        deleteAnswerSet(input:{id:$id}) {
            clientMutationId
        }
    }`,


    PUBLISH: 
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

    UNPUBLISH: 
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
        
    UPDATE: 
    `mutation ($input: UpdateAnswersetAndAnswersInput!) {
        updateAnswersetAndAnswers(input: $input){
            clientMutationId
        }
    }`,

    // get an answer set by ID
    GET_BY_ID: 
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
            }
            testBook {
                title
                version
                filename
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

};
