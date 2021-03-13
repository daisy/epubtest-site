import initExpressApp from './app.js';
import winston from 'winston';

const port = process.env.PORT || 8000;
(async () => {
    // init logger
    let transports = [new winston.transports.File({ filename: 'epubtest-site-error.log', level: 'error' })];
    if (process.env.NODE_ENV != 'production') {
        transports.push(new winston.transports.Console({format: winston.format.simple(),}));
    }
    winston.configure({
        transports
    });

    
    let app = await initExpressApp();
    app.listen(port, () => winston.log('info', `epubtest listening on port ${port}!`))
})();

