module.exports = {
    LOGIN: 
    `mutation ($input: AuthenticateInput!){
        authenticate(input: $input) {
            jwtToken
        }
    }`,

    // input: {email, duration}
    TEMPORARY_TOKEN: 
    `mutation ($input: CreateTemporaryTokenInput!) {
        createTemporaryToken(input: $input) {
            jwtToken
        }
    }`,

    SET_PASSWORD:
    `mutation ($input: SetPasswordInput!) {
        setPassword(input: $input) {
            clientMutationId
        }
    }`,
}