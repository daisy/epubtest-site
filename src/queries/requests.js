const generate  = require('./crudGenerator');
const requestFrag = require('./fragments/request');


const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("request", "requests", requestFrag.FIELDS);

const GET_FOR_ANSWERSETS =
    `query($ids: [Int!]) {
        requests(filter:{answerSetId:{in: $ids}}) {
            nodes {
                ${requestFrag.FIELDS}
            }
        }
    }`;

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL, GET_FOR_ANSWERSETS
};
