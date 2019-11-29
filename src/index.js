const express = require('express')
const path = require('path');
const cors = require('cors');

const cookieParser = require('cookie-parser');
const nunjucks = require('nunjucks');
const nunjucksDate = require("nunjucks-date");

const publicRoutes = require('./routes/public');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const publicFormRoutes = require('./routes/public-forms');
const userFormRoutes = require('./routes/user-forms');
const adminFormRoutes = require('./routes/admin-forms');
const middleware = require('./middleware');

const { body,validationResult, sanitizeBody } = require('express-validator');

const app = express()

require('dotenv').config({path: path.join(__dirname, '../.env')});

var env = nunjucks.configure('src/pages/templates', {
    autoescape: true,
    express: app
});
nunjucksDate.setDefaultFormat("MMMM Do YYYY");
nunjucksDate.install(env);

app.use(cors());
app.use(cookieParser());
app.use(middleware.accessLevel);
app.use(express.urlencoded({extended: true}));

app.use('/images', express.static(path.join(__dirname, `./pages/images`)));
app.use('/css', express.static(path.join(__dirname, `./pages/css`)));
app.use('/js', express.static(path.join(__dirname, `./pages/js`)));
app.use('/books', express.static(path.join(__dirname, `./pages/books`)));

app.use('/', publicRoutes);
app.use('/user', middleware.isAuthenticated, userRoutes);
app.use('/admin', middleware.isAuthenticated, middleware.isAdmin, adminRoutes);
app.use('/forms', publicFormRoutes);
app.use('/forms', middleware.isAuthenticated, userFormRoutes);
app.use('/forms', middleware.isAuthenticated, middleware.isAdmin, adminFormRoutes);

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`epubtest.org listening on port ${port}!`))
