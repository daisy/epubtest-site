const fragments = require('./fragments');
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
            ${fragments.ANSWERSET_FIELDS}
            testingEnvironment {
                ${fragments.TESTING_ENVIRONMENT_FIELDS}
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
    }`,

    GET_FOR_BOOK: 
    `query getAnswerSetsForTestBook($testBookId:Int!) {
        answerSets(condition:{testBookId: $testBookId}) {
            nodes {
                id
                answersByAnswerSetId {
                    ${fragments.ANSWER_FIELDS}
                }
            }
        }
    }
    `

};
