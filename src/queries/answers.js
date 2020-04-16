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
    }`
};
