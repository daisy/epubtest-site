import generate from './crudGenerator.js';

const FIELDS = () => `
id
label
`;

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("lang", "langs", FIELDS);

export {
    FIELDS,
    CREATE, DELETE, UPDATE, GET, GET_ALL 
};
