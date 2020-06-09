module.exports = {
    ADD: 
    `mutation ($newAnswerInput: CreateAnswerInput!) {
        createAnswer(input: $newAnswerInput) {
            clientMutationId
            answer {
                id
            }
        }
    }`,
    
    DELETE: 
    `mutation ($id:Int!) {
        deleteAnswer(input:{id:$id}) {
            clientMutationId
        }
    }`,

    GET_FOR_ANSWER_SET:
    `query ($answerSetId: Int!) {
        answers(condition: {answerSetId: $answerSetId}) {
            nodes {
                id
                flag
                value
                test {
                    id
                }
            }
        }
    }`,

    FLAG: 
    `mutation updateAnswer ($answerId: Int!) {
        updateAnswer(input: {
          id: $answerId,
          patch: {
              value: NOANSWER
              flag: true
          }
        }) {
          clientMutationId
        }
    }`
};
