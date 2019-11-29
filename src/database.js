const axios = require('axios');

module.exports = {
    query: (queryString, jwt=null) => {
        let request = makeRequest(queryString, jwt);
        // return a promise
        return axios(request);
    },

    // multiQuery: (queryStrings, jwt=null) => {
    //     let requests = queryStrings.map(q => makeRequest(q, jwt));
    //     return axios.all(requests.map(r => axios.get(r)));
    // },

    makeRequest
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