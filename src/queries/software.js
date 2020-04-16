module.exports = {
    GET_BY_TYPE: 
    `query ($type: SoftwareType!) {
        softwares(condition: {type: $type}) {
            nodes{
                id
                name
            	version
            	vendor
            }
        }
    }`,
    ADD:
    `mutation ($newSoftwareInput: CreateSoftwareInput!) {
        createSoftware(input:$newSoftwareInput) {
            clientMutationId
        }
    }`,

};