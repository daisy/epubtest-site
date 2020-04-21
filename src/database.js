const axios = require('axios');

/*
returns

{
    success: boolean,
    data: database data,
    message: simple error message,
    errors: detailed error messages
}
*/
async function query(queryString, variables = {}, jwt=null) {
    //let request = makeRequest(queryString, variables, jwt);
    let request = {
        url: process.env.GRAPHQLURL,
        method: 'post',
        data: {
            query: queryString,
            variables
        }
    };
    if (jwt) {
        request.headers = {'Authorization': `bearer ${jwt}`};            
    }
    try {
        let response = await axios(request);
        // if for some reason there is no data associated with this response but no error triggered the catch
        if (!response.hasOwnProperty("data")) {
            return {
                success: false,
                message: "Database request could not be processed",
                errors:  []
            }
        }
        else {
            // if the response came back with errors, e.g. graphQL rejected the query string
            if (response.data.hasOwnProperty("errors")) {
                return {
                    data: null,
                    success: false,
                    message: "Database request contains errors",
                    errors: response.data.errors
                }
            }
            // otherwise return the data from the query
            return {
                data: response.data.data,
                success: true,
                errors: [],
                message: ''
            }
        }
    }
    // error originating from axios, e.g. endpoint could not be reached
    catch (err) {
        return {
            success: false,
            message: `Database error: ${err.message}`,
            errors: [err]
        };
    }
}

module.exports = {
    query
}