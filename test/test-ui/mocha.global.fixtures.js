import initExpressApp from '../../src/app.js';
import winston from 'winston';

export async function mochaGlobalSetup() {
    winston.add(new winston.transports.Console({format: winston.format.simple()}));
    winston.level = 'debug';
    const port = process.env.PORT || 8000;
    let app = await initExpressApp();
    this.server = app.listen(port, () => winston.log('info', `epubtest listening on port ${port}!`))
}
export async function mochaGlobalTeardown() {
    await this.server.close();
}