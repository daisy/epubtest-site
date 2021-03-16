import initExpressApp from '../../src/app.js';
import winston from 'winston';

async function setup() {
    winston.add(new winston.transports.Console({format: winston.format.simple()}));
    winston.level = 'debug';
    const port = process.env.PORT || 8000;
    let app = await initExpressApp();
    let server = app.listen(port, () => winston.log('info', `epubtest listening on port ${port}!`))
    return server;
}
async function teardown(server) {
    await server.close();
}
async function mochaGlobalSetup() {
    this.server = await setup();
}
async function mochaGlobalTeardown() {
    await teardown(this.server);
}

export {
    setup,
    teardown,
    mochaGlobalSetup,
    mochaGlobalTeardown
}