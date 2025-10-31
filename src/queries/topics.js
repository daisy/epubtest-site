import generate from './crudGenerator.js';

const FIELDS = () =>  `
id
order`;

const {CREATE, DELETE, UPDATE, GET} 
    = generate("topic", "topics", FIELDS);

const GET_ALL = () => 
`query {
    topics(orderBy:ORDER_ASC) {
        ${FIELDS()}
    }
}`;

export {
    FIELDS,
    CREATE, DELETE, UPDATE, GET, GET_ALL 
};
