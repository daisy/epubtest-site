import generate from './crudGenerator.js';
import * as tests from './tests.js';

const FIELDS = () => `
id
test {
    ${tests.FIELDS()}
}
value
flag
notes
notesArePublic
lastModified
`;

export { FIELDS };

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("answer", "answers", FIELDS);


export { CREATE, DELETE, UPDATE, GET, GET_ALL };