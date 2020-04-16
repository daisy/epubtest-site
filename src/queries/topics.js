module.exports = {
    // get all topics, in order
    GET_ALL: 
    `query {
        topics(orderBy:ORDER_ASC) {
            nodes {
                id
                order
                type
            }
        }
    }`,
}