const fragments = require('./fragments');
module.exports = {
    ADD:
    `mutation ($newSoftwareInput: CreateSoftwareInput!) {
        createSoftware(input:$newSoftwareInput) {
            clientMutationId
        }
    }`,
    
    // this is different: instead of using graphql variables, we just use a template string
    // because we have to know the value of the variable 'type' when we construct the query
    GET_BY_TYPE: type => `
    query {
        softwares(condition: {type: ${type}}) {
            nodes{
                ${fragments.SOFTWARE_FIELDS}
                ${type === "READING_SYSTEM" ? 
                    `testingEnvironmentsByReadingSystemId` 
                    : type === "ASSISTIVE_TECHNOLOGY" ? 
                    `testingEnvironmentsByAssistiveTechnologyId`
                    : type === "OS" ? 
                    `testingEnvironmentsByOsId` 
                    : type == "BROWSER" ? 
                    `testingEnvironmentsByBrowserId`
                    : ''
                }
                    {
                    totalCount
                    nodes{
                        id
                    }
                }
            }
        }
    }`,

    GET_BY_ID: `
    query ($id: Int!) {
        software(id: $id) {
            ${fragments.SOFTWARE_FIELDS}
        }
    }
    `,

    GET_BY_ID_EXTD: type => `
    query ($id: Int!) {
        software(id: $id) {
            ${fragments.SOFTWARE_FIELDS}
            ${type === "READING_SYSTEM" ? 
                `testingEnvironmentsByReadingSystemId` 
                : type === "ASSISTIVE_TECHNOLOGY" ? 
                `testingEnvironmentsByAssistiveTechnologyId`
                : type === "OS" ? 
                `testingEnvironmentsByOsId` 
                : type == "BROWSER" ? 
                `testingEnvironmentsByBrowserId`
                : ''
            }
            {
                nodes {
                    ${fragments.TESTING_ENVIRONMENT_FIELDS}
                }
            }
        }
    }`,

    UPDATE: `
    mutation ($input: UpdateSoftwareInput!){
        updateSoftware(input:$input) {
           clientMutationId
       }
    }`,

    DELETE: `
    mutation($id: Int!) {
        deleteSoftware(input: {id: $id}) {
            clientMutationId
        }
    }`
    
};