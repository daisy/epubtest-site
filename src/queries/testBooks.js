module.exports = {
    DELETE: 
    `mutation ($id: Int!) {
        deleteTestBook(input:{ id:$id}) {
          clientMutationId
        }
    }`,

    ADD: 
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

    // get all the latest test books
    GET_LATEST: 
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

    GET_BY_ID: 
    `query($id: Int!) {
        testBook(id: $id) {
            id
            title
            langId
            version
        }
    }`,
};