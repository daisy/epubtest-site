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

    GET_FOR_BOOK: 
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
    
}