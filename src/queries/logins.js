const generate  = require('./crudGenerator');
const loginFrag = require('./fragments/login');

const {DELETE, UPDATE, GET, GET_ALL} 
    = generate("login", "logins", loginFrag.FIELDS);

// custom CREATE instead of using crudGenerator's
// this uses our custom pgsql function, which hashes the password
const CREATE_NEW_LOGIN = `
mutation ($email: String!, $password: String!, $active: Boolean = true){
    createNewLogin(input:{
      email: $email
      pwd: $password
      active: $active
    }) {
      clientMutationId
      integer
    }
  }
`;

module.exports = {
    DELETE, UPDATE, GET, GET_ALL, CREATE_NEW_LOGIN
};
