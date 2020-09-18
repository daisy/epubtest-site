const axios = require('axios');
const winston = require('winston');

let getQueryName = str => {
    try {
        return /^[^\n]+\n(.+)/mg.exec(str)[1].trim();
    }
    catch(err) {
        return str;
    }
}

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
            let message = "Database request could not be processed";
            winston.error(message);
            return {
                success: false,
                message,
                errors:  []
            }
        }
        else {
            // if the response came back with errors, e.g. graphQL rejected the query string
            if (response.data.hasOwnProperty("errors")) {
                let message = "Database request contains errors";
                let errorMessages = response.data.errors.map((err, idx) => `${idx+1}. ${err.message}`).join("\n");
                winston.error(`${message}\nQuery: ${getQueryName(queryString)}\nVariables: ${JSON.stringify(variables)}\n${errorMessages}\n`);
                return {
                    data: null,
                    success: false,
                    message,
                    errors: response.data.errors
                }
            }
            // otherwise return the data from the query
            // grab the name of the query
            
            winston.log('info', `Database request success: "${getQueryName(queryString)}..."\n`)
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
        let msg = err.hasOwnProperty('message') ? err.message : err;
        winston.error("Database error:\n " + msg);

        return {
            success: false,
            message: `Database error: ${msg}`,
            errors: [err]
        };
    }
}

module.exports = {
    query
}