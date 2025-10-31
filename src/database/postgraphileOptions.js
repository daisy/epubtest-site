import PgSimplifyInflectorPlugin from "@graphile-contrib/pg-simplify-inflector";
import PgFilterPlugin from "postgraphile-plugin-connection-filter";
import PgOrderByPlugin from "@graphile-contrib/pg-order-by-related";
const options = {
    dynamicJson: true,
    //cors: true,
    //graphiql: false,
    //graphqlRoute: '/graphql',
    //externalUrlBase: ``,
    pgDefaultRole: process.env.DB_DEFAULT_ROLE || 'epubtest_public_role',
    // If consuming JWT:
    jwtSecret: process.env.JWT_SECRET,
    // If generating JWT:
    jwtPgTypeIdentifier: process.env.JWT_PG_TYPE_IDENTIFIER || 'epubtest.jwt_token',
    ignoreRBAC: false,
    appendPlugins: [PgSimplifyInflectorPlugin, PgFilterPlugin, PgOrderByPlugin],
    simpleCollections: "only",
    graphileBuildOptions: {pgOmitListSuffix: true}
};

export { options };