const generate  = require('./crudGenerator');
const answerFrag = require('./fragments/answer');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("answer", "answers", answerFrag.FIELDS);

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL };