const generate  = require('./crudGenerator');
const topicFrag = require('./fragments/topic');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("topic", "topics", topicFrag.FIELDS);

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL 
};
