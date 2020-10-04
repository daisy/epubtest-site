let errors = [];

module.exports.addError = err => {
    errors.push(err);
}

module.exports.addErrors = errs => {
    for (err of errs) {
        errors.push(err);
    }
}

module.exports.getErrors = () => {
    return errors;
};