import express from 'express';
import * as path from 'path';
import cors from 'cors';

import cookieParser from 'cookie-parser';
import nunjucks from 'nunjucks';

import dayjs from "dayjs";

import rateLimit from 'express-rate-limit';

import winston from 'winston';
import postgraphile from 'postgraphile';
import { options as postgraphileOptions } from './database/postgraphileOptions.js';

import {router as publicRoutes} from './routes/public.js';
import {router as userRoutes} from './routes/user.js';
import {router as adminRoutes} from './routes/admin.js';
import {router as publicFormRoutes} from './routes/public-forms.js';
import {router as userFormRoutes} from './routes/user-forms.js';
import {router as adminFormRoutes} from './routes/admin-forms.js';
import * as middleware from './middleware.js';

// import i18next from 'i18next';
// import i18nextMiddleware from 'i18next-http-middleware';
// import Backend from 'i18next-fs-backend';
import * as LANGS from './l10n/langs.js';
import { initDatabaseConnection, DBURL } from './database/index.js';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiLimiter = rateLimit();
const app = express()

var env = nunjucks.configure('src/pages/templates', {
    autoescape: true,
    express: app,
    noCache: process.env.NODE_ENV != 'production'
});
env.addFilter('cleanString', str => {
    return str.replace(/&nbsp;/g, " ");
});
env.addFilter('date', (date, format = defaultFormat) => {
    return dayjs(date).format(format)
});

async function initExpressApp() {
    await initDatabaseConnection();

    // Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    // see https://expressjs.com/en/guide/behind-proxies.html
    app.set('trust proxy', 1);

    app.use(cors());
    app.use(cookieParser());

    app.use(middleware.readOnly);
    app.use(middleware.accessLevel);
    app.use(middleware.addDayJS);
    app.use(express.urlencoded({extended: true}));
    //app.use(middleware.currentLanguage);
    //app.use(middleware.translate);

    // i18next
    //     .use(Backend)
    //     //.use(i18nextMiddleware.LanguageDetector)
    //     .init({
    //         debug: false,
    //         backend: {
    //             // eslint-disable-next-line no-path-concat
    //             loadPath: __dirname + '/l10n/{{lng}}.json',
    //             // eslint-disable-next-line no-path-concat
    //             //addPath: __dirname + '/locales/{{lng}}/{{ns}}.missing.json'
    //         },
    //         cookie: 'i18n',
    //         fallbackLng: 'en',
    //         preload: LANGS,
    //         saveMissing: true
    //     });
    // app.use(i18nextMiddleware.handle(i18next, {ignoreRoutes: ['/admin']}));

    app.use('/images', express.static(path.join(__dirname, `./pages/images`)));
    app.use('/css', express.static(path.join(__dirname, `./pages/css`)));
    app.use('/js', express.static(path.join(__dirname, `./pages/js`)));
    app.use('/books', express.static(path.join(__dirname, `./pages/books`)));

    app.use('/', publicRoutes);
    app.use('/user', middleware.isAuthenticated, userRoutes);
    app.use('/admin', middleware.isAuthenticated, middleware.isAdmin, adminRoutes);
    
    // only use the rate limiter in production mode
    if (process.env.NODE_ENV != 'production') {
        app.use('/forms', publicFormRoutes);    
    }
    else {
        app.use('/forms', apiLimiter, publicFormRoutes);
    }
    
    app.use('/user/forms', middleware.isAuthenticated, userFormRoutes);
    app.use('/admin/forms', middleware.isAuthenticated, middleware.isAdmin, adminFormRoutes);

    // enable via env file: 
    // ENDPOINT=true
    // creates /graphql endpoint to enable direct testing of graphiql queries
    if (process.env.ENDPOINT == 'true') {    
        app.use('/', 
            postgraphile.postgraphile(
                DBURL, 
                process.env.DB_SCHEMAS, 
                {
                    ...postgraphileOptions,
                    readCache: `${__dirname}/database/postgraphile.cache`,
                }
            )
        );
        console.log("Database available on /graphql");
    }

    // catch-all for unrecognized routes
    app.get('*', (req, res, next) => {
        let err = new Error('Page Not Found');
        err.statusCode = 404;
        next(err);
    });

    // error middleware goes here at the end
    app.use(middleware.error);

    return app;
}


//module.exports = app;
export default initExpressApp;