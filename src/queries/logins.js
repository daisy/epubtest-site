import generate from './crudGenerator.js';

const FIELDS = () => `
id
email
lastSeen
active
type`;

const {DELETE, UPDATE, GET, GET_ALL} 
    = generate("login", "logins", FIELDS);

// custom CREATE instead of using crudGenerator's
// this uses our custom pgsql function, which hashes the password
const CREATE_NEW_LOGIN = () => `
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

export {
    FIELDS,
    DELETE, UPDATE, GET, GET_ALL, CREATE_NEW_LOGIN
};
