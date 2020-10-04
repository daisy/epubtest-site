const generate  = require('./crudGenerator');
const userFrag = require('./fragments/user');


const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("user", "users", userFrag.FIELDS);


const { GET: GET_EXTENDED, GET_ALL: GET_ALL_EXTENDED}
    = generate("user", "users", userFrag.FIELDS_WITH_LOGIN);

const GET_INACTIVE =
`query {
    getInactiveUsers {
        id
        name
        email
    }
}`;

const GET_ACTIVE =
`query {
    getActiveUsers {
        id
        name
    }
}`;

const GET_EMAIL = 
`query($id: Int!) {
    user (id: $id) {
        login{
            email
        }
    }
}`;

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL,
    GET_INACTIVE, GET_ACTIVE, GET_EMAIL,
    GET_EXTENDED, GET_ALL_EXTENDED
};

