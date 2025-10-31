// from https://github.com/graphile/cookbook/blob/master/examples/schema_only/QueryRunner.js
import pg from 'pg';
const { Pool } = pg;
import gql from 'graphql';
const { graphql } = gql;
import postgraphile from "postgraphile";
const {
    withPostGraphileContext,
    createPostGraphileSchema,
} = postgraphile;

async function makeQueryRunner(
    connectionString = "postgres:///",
    schemaName = "public",
    options = {} // See https://www.graphile.org/postgraphile/usage-schema/ for options
) {
  // Create the PostGraphile schema
    const schema = await createPostGraphileSchema(
        connectionString,
        schemaName,
        options
    );

    // Our database pool
    const pgPool = new Pool({
        connectionString,
    });

    // The query function for issuing GraphQL queries
    const query = async (
        graphqlQuery, // e.g. `{ __typename }`
        variables = {},
        jwtToken = null, // A string, or null
        operationName = null
    ) => {
        // Whatever you need to appease your pgSettings function, if you have one, should be put in here.
        const fakeRequest = { headers: {} };

        // pgSettings and additionalContextFromRequest cannot be functions at this point
        const pgSettings =
        typeof options.pgSettings === "function"
            ? options.pgSettings(fakeRequest)
            : options.pgSettings;
        const additionalContextFromRequest =
        typeof options.additionalContextFromRequest === "function"
            ? options.additionalContextFromRequest(fakeRequest)
            : options.additionalContextFromRequest;

        return await withPostGraphileContext(
        {
            ...options,
            pgPool,
            jwtToken: jwtToken,
            pgSettings,
        },
        async (context) => {
            // Do NOT use context outside of this function.
            return await graphql(
                schema,
                graphqlQuery,
                null,
                {
                    ...context,
                    ...additionalContextFromRequest,
                    /* You can add more to context if you like */
                },
                variables,
                operationName
            );
        });
    };

    // Should we need to release this query runner, the cleanup tasks:
    const release = () => {
        pgPool.end();
    };

    return {
        query,
        release,
    };
}

export { makeQueryRunner };