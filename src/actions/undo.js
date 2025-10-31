// sometimes we may need to rollback database entries
// as we don't have good transaction support in graphql without writing lots of postgres functions
// we can do what we need here, just by deleting entries or undoing patches

import * as db from '../database/index.js';
import * as Q from '../queries/index.js';

/*

transactions: 

[
    {
        objectType: ANSWER_SETS | ANSWERS | TEST_BOOKS | ... ,
        id,
        actionWas: CREATE | DELETE | UPDATE,
        previousState: {...}
    }
]

*/

async function undo(transactions, jwt) {
    for (let transaction of transactions) {
        if (transaction.actionWas == 'CREATE') {
            await db.query(
                Q[transaction.objectType].DELETE(), 
                { id: transaction.id },
                jwt
            );
        }
        // this is tricky because the ID has to be the same as it was before
        // i don't feel confident about this working without glitches
        // not going to use it for now
        // if a delete operation fails halfway through, we may end up with some fragmented data but 
        // it shouldn't be in the way of anything, and it could be cleaned up easily enough
        // else if (transaction.actionWas == 'DELETE') {
        //     await db.query(
        //         Q[transaction.objectType].CREATE(), 
        //         {
        //             input: transaction.previousState
        //         },
        //         jwt
        //     );
        // }
        else if (transaction.actionWas == 'UPDATE') {
            await db.query(
                Q[transaction.objectType].UPDATE(), 
                {
                    id: transaction.id,
                    patch: transaction.previousState
                },
                jwt
            );
        }
    }
}

// module.exports = undo;
export { undo };