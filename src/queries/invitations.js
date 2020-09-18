const generate  = require('./crudGenerator');
const invitationFrag = require('./fragments/invitation');

const {CREATE, DELETE, UPDATE, GET, GET_ALL} 
    = generate("invitation", "invitations", invitationFrag.FIELDS);

module.exports = {
    CREATE, DELETE, UPDATE, GET, GET_ALL 
};
