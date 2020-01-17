const axios = require('axios');

async function query(queryString, variables, jwt=null) {
    let request = makeRequest(queryString, variables, jwt);
    // return a promise
    let retval = await axios(request);
    return retval;
}

async function queries(queryStringArray, variablesArray, jwt=null) {
    let retval = await Promise.all(queryStringArray.map((q, idx) => axios(makeRequest(q, variablesArray[idx], jwt))));
    return retval;
}
 
// create request object
function makeRequest(queryString, variables, jwt=null) {
    let request = {
        url: process.env.GRAPHQLURL,
        method: 'post',
        data: {
            query: queryString,
            variables: variables
        }
    };
    if (jwt) {
        request.headers = {'Authorization': `bearer ${jwt}`};            
    }
    return request;
}

module.exports = {
    query, queries
}