const express = require('express')
const path = require('path');
const cors = require('cors');

const cookieParser = require('cookie-parser');
const nunjucks = require('nunjucks');
const nunjucksDate = require("nunjucks-date");

const rateLimit = require("express-rate-limit");  

const publicRoutes = require('./routes/public');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const publicFormRoutes = require('./routes/public-forms');
const userFormRoutes = require('./routes/user-forms');
const adminFormRoutes = require('./routes/admin-forms');
const middleware = require('./middleware');

const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');

const apiLimiter = rateLimit();
const app = express()

require('dotenv').config({path: path.join(__dirname, '../.env')});

var env = nunjucks.configure('src/pages/templates', {
    autoescape: true,
    express: app
});
nunjucksDate.setDefaultFormat("MMMM Do YYYY");
nunjucksDate.install(env);

// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', 1);

app.use(cors());
app.use(cookieParser());
app.use(middleware.currentLanguage);
app.use(middleware.accessLevel);
app.use(express.urlencoded({extended: true}));

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    // debug: true,
    backend: {
      // eslint-disable-next-line no-path-concat
      loadPath: __dirname + '/locales/{{lng}}.json',
      // eslint-disable-next-line no-path-concat
      //addPath: __dirname + '/locales/{{lng}}/{{ns}}.missing.json'
    },
    fallbackLng: 'en',
    preload: ['en', 'fr'],
    saveMissing: true
  })

app.use(i18nextMiddleware.handle(i18next));


app.use('/images', express.static(path.join(__dirname, `./pages/images`)));
app.use('/css', express.static(path.join(__dirname, `./pages/css`)));
app.use('/js', express.static(path.join(__dirname, `./pages/js`)));
app.use('/books', express.static(path.join(__dirname, `./pages/books`)));

app.use('/', publicRoutes);
app.use('/user', middleware.isAuthenticated, userRoutes);
app.use('/admin', middleware.isAuthenticated, middleware.isAdmin, adminRoutes);
app.use('/forms', apiLimiter, publicFormRoutes);
app.use('/user/forms', middleware.isAuthenticated, userFormRoutes);
app.use('/admin/forms', middleware.isAuthenticated, middleware.isAdmin, adminFormRoutes);


// catch-all for unrecognized routes
app.get('*', (req, res, next) => {
    let err = new Error('Page Not Found');
    err.statusCode = 404;
    next(err);
});

// error middleware goes here at the end
app.use(middleware.error);

module.exports = app;
