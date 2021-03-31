import generate from './crudGenerator.js';
import * as testBooks from './testBooks.js';

const {GET, GET_ALL} 
    = generate("testBook", "testBooks", testBooks.FIELDS_WITH_TESTS);


export {
    GET, GET_ALL
};
