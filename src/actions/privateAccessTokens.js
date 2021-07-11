import * as db from '../database/index.js';
import * as Q from '../queries/index.js';
import { randomBytes } from 'crypto';

async function add(answerSetId, jwt) {
    let errors = [];
    let privateAccessToken;

    try {
        let dbres = await db.query(
            Q.AUTH.TEMPORARY_TOKEN(),
            {
                input: {
                    email: '',
                    duration: '365 days'
                }
            });
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let temporaryJwt = dbres.data.createTemporaryToken.jwtToken;

        // key is a short string that goes in the link
        // it is associated with the token via the database
        let key = randomBytes(12).toString('hex').slice(0, 12);
        
        dbres = await db.query(
            Q.PRIVATE_ACCESS_TOKENS.CREATE(),
            {
                input: {
                    token: temporaryJwt,
                    answerSetId,
                    key
                }
            },
            jwt
        );
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        let privateAccessTokenId = parseInt(dbres.data.createPrivateAccessToken.privateAccessToken.id);
        dbres = await db.query(
            Q.PRIVATE_ACCESS_TOKENS.GET(),
            {
                id: privateAccessTokenId
            },
            jwt
        );
        if (!dbres.success) {
            errors = dbres.errors;
            throw new Error();
        }
        privateAccessToken = dbres.data.privateAccessToken;
    }
    catch(err) {
        return {success: false, errors: errors.length > 0 ? errors : [err]};
    }
    return {success: true, errors: [], privateAccessToken};

}


export {
    add
}