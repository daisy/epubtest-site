const fragments = require('./fragments');

module.exports = {
    ADD:
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
    
    DELETE: 
    `mutation($id: Int!) {
        deleteTest(input: {id: $id}) {
            clientMutationId
        }
    }`,

    GET_FOR_BOOK: 
    `query ($testBookId: Int!) {
        tests (condition: {testBookId: $testBookId}) {
          nodes {
            ${fragments.TEST_FIELDS}
          }
        }
    }`,
    
}