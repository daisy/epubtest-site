module.exports = {
    GET_INACTIVE: 
    `query {
        getInactiveUsers {
            nodes {
                id
                name
                email
            }
        }
    }`,

    GET_ACTIVE: 
    `query {
        getActiveUsers {
            nodes {
                id
                name
            }
        }
    }`,

    
    // get the profile for a given user
    GET_BY_ID: 
    `query($id: Int!) {
        user (id: $id) {
            name
            organization
            website
            includeCredit
            creditAs
        }
    }`,

    GET_EMAIL: 
    `query($id: Int!) {
        user (id: $id) {
            login{
                email
            }
        }
    }`,

    UPDATE: 
    `mutation ($id: Int!, $data: UserPatch!) {
        updateUser(input: {
            id: $id,
            patch: $data
        }) {
            clientMutationId
        }
    }`,

};