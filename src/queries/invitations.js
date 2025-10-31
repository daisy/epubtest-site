import generate from './crudGenerator.js';
import * as users from './users.js';

const FIELDS = () => `
id
userId
dateInvited
`;

const FIELDS_WITH_LOGIN = () => `
id
user {
    ${users.FIELDS_WITH_LOGIN()}
}
dateInvited
`;

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("invitation", "invitations", FIELDS_WITH_LOGIN);

const GET_FOR_USER = () => `
query ($userId:Int!) {
    invitations(condition:{userId: $userId}) {
        ${FIELDS()}
    }
}
`;

export {
    FIELDS, FIELDS_WITH_LOGIN,
    CREATE, DELETE, UPDATE, GET, GET_ALL, GET_FOR_USER
};
