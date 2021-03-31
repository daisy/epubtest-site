import generate from './crudGenerator.js';

const FIELDS = () => `
id
testId
testBookId
name
description
xhtml
order
flag
`;

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("test", "tests", FIELDS);

export {
    FIELDS,
    CREATE, DELETE, UPDATE, GET, GET_ALL 
};
