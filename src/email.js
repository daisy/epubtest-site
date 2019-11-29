function emailUser(token) {
    console.log("http://localhost:8000/set-password/?token=" + token);
}

module.exports = {
    emailUser
}