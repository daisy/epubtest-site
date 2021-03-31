import generate from './crudGenerator.js';
import * as login from './logins.js';

const FIELDS = () => `
id
name
organization
website
includeCredit
creditAs
isMigration`;

const FIELDS_WITH_LOGIN = () => `
${FIELDS()}
login {
    ${login.FIELDS()}
}
`;

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("user", "users", FIELDS);


const { GET: GET_EXTENDED, GET_ALL: GET_ALL_EXTENDED}
    = generate("user", "users", FIELDS_WITH_LOGIN);

const GET_INACTIVE = () => 
`query {
    getInactiveUsers {
        id
        name
        email
    }
}`;

const GET_ACTIVE = () => 
`query {
    getActiveUsers {
        id
        name
    }
}`;

const GET_EMAIL = () => 
`query($id: Int!) {
    user (id: $id) {
        login{
            email
        }
    }
}`;

export {
    FIELDS, FIELDS_WITH_LOGIN,
    CREATE, DELETE, UPDATE, GET, GET_ALL,
    GET_INACTIVE, GET_ACTIVE, GET_EMAIL,
    GET_EXTENDED, GET_ALL_EXTENDED
};

