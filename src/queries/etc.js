const DBVERSION = `query {
  dbInfo(field:"version") {
    value
  }
}`;

const DELETE_ALL_DATA = `mutation {
  deleteAllData(input:{}) {
    clientMutationId
  }
}`;
module.exports = { DBVERSION, DELETE_ALL_DATA };