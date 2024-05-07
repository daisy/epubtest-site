import generate from './crudGenerator.js';
import * as testBooks from './testBooks.js';

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
const FIELDS_WITH_TEST_BOOK = () => `
${FIELDS()}
testBook {
    ${testBooks.FIELDS()}
}
`;

let {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("test", "tests", FIELDS);


// override GET to get more fields
GET = () => `
query {
    test() {
        ${FIELDS_WITH_TEST_BOOK()}
    }
}
`

export {
    FIELDS, FIELDS_WITH_TEST_BOOK,
    CREATE, DELETE, UPDATE, GET, GET_ALL
};
