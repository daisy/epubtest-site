const DBVERSION = `query {
  dbInfo(field:"version") {
    value
  }
}`;

module.exports = { DBVERSION };