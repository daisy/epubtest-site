module.exports = {
    DBVERSION: `query {
        dbInfo(field:"version") {
          value
        }
      }`
};