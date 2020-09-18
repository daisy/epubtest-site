const generate  = require('./crudGenerator');
const langFrag = require('./fragments/lang');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("lang", "langs", langFrag.FIELDS);

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL 
};
