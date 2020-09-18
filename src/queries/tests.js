const testFrag = require('./fragments/test');
const generate  = require('./crudGenerator');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("test", "tests", testFrag.FIELDS);

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL 
};
