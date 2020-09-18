const generate  = require('./crudGenerator');
const testBookFrag = require('./fragments/testBook');

const {GET, GET_ALL} 
    = generate("testBook", "testBooks", testBookFrag.FIELDS_WITH_TESTS);


module.exports = {
    GET, GET_ALL
};
