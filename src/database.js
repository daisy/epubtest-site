const axios = require('axios');

async function query(queryString, jwt=null) {
    let request = makeRequest(queryString, jwt);
    // return a promise
    let retval = await axios(request);
    return retval;
}

async function queries(queryStringArray, jwt=null) {
    let retval = await Promise.all(queryStringArray.map(q => axios(makeRequest(q, jwt))));
    return retval;
}
 
// create request object
function makeRequest(queryString, jwt=null) {
    let request = {
        url: process.env.GRAPHQLURL,
        method: 'post',
        data: {
            query: queryString
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