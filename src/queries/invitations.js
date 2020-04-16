module.exports = {
    GET_ALL: 
    `query {
        invitations {
            nodes {
                user {
                    id
                    name
                }
                dateInvited
            }
        }
    }`,

    ADD: 
    `mutation ($input: CreateInvitationInput!) {
        createInvitation(input: $input) {
            clientMutationId
        }
    }`,

};