const generate  = require('./crudGenerator');
const invitationFrag = require('./fragments/invitation');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("invitation", "invitations", invitationFrag.FIELDS_WITH_LOGIN);

const GET_FOR_USER = `
query ($userId:Int!) {
    invitations(condition:{userId: $userId}) {
        ${invitationFrag.FIELDS}
    }
}
`;

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL, GET_FOR_USER
};
