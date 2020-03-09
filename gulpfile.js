const { src } = require('gulp');
const gulpStylelint = require('gulp-stylelint');

function css() {
    return src('src/pages/css/**/*.css', { base: './' })
    .pipe(gulpStylelint({
        reporters: [
            { formatter: 'string', console: true, fix: true }
        ]
    }));

}

exports.default = css;