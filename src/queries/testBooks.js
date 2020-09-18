const generate  = require('./crudGenerator');
const testBookFrag = require('./fragments/testBook');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("testBook", "testBooks", testBookFrag.FIELDS);

// get all the latest test books
const GET_LATEST =
`query {
    getLatestTestBooks{
        nodes{
            ${testBookFrag.FIELDS_WITHOUT_NESTING}
        }
    }
}`;

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL, GET_LATEST
};