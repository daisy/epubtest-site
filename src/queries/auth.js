const LOGIN = () => 
`mutation ($input: AuthenticateInput!){
    authenticate(input: $input) {
        jwtToken
    }
}`;

    // input: {email, duration}
const TEMPORARY_TOKEN = () => 
`mutation ($input: CreateTemporaryTokenInput!) {
    createTemporaryToken(input: $input) {
        jwtToken
    }
}`;

const SET_PASSWORD = () => 
`mutation ($input: SetPasswordInput!) {
    setPassword(input: $input) {
        clientMutationId
    }
}`;

export { LOGIN, TEMPORARY_TOKEN, SET_PASSWORD };