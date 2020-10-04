const generate  = require('./crudGenerator');
const topicFrag = require('./fragments/topic');

const {CREATE, DELETE, UPDATE, GET} 
    = generate("topic", "topics", topicFrag.FIELDS);

const GET_ALL =  
`query {
    topics(orderBy:ORDER_ASC) {
        nodes {
            ${topicFrag.FIELDS}
        }
    }
}`;

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL 
};
