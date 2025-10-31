// crudGenerator generates CRUD operations in GraphQL for the given data type

// dataType should be UpperCase and singular, lowerDataType should be lowerCase and singular
const CREATE = (upperDataType, lowerDataType) => 
`mutation ($input: ${upperDataType}Input!) {
    create${upperDataType}(input: {
        ${lowerDataType}: $input
    }) {
        clientMutationId
        ${lowerDataType} {
            id
        }
    }
}`;

// dataType should be lowerCase and singular
const GET = (dataType, fieldsFunc) =>
`query($id: Int!) {
    ${dataType} (id: $id) {
        ${fieldsFunc()}
    }
}`;

// dataType should be UpperCase and singular
const UPDATE = dataType =>
`mutation ($id: Int!, $patch: ${dataType}Patch!) {
    update${dataType}(input: {
        id: $id,
        patch: $patch
    }) {
        clientMutationId
    }
}`;

// dataType should be UpperCase and singular
const DELETE = dataType => 
`mutation ($id:Int!) {
    delete${dataType}(input:{id:$id}) {
        clientMutationId
    }
}`;

// dataType should be lowerCase and plural
const GET_ALL = (dataType, fieldsFunc) =>
`query {
    ${dataType} {
        ${fieldsFunc()}
    }
}`;

export default function generate(singular, plural, fieldsFunc) {
    let lowerSingular = singular[0].toLowerCase() + singular.slice(1);
    let lowerPlural = plural[0].toLowerCase() + plural.slice(1);
    let upperSingular = singular[0].toUpperCase() + singular.slice(1);

    return {
        CREATE: () => CREATE(upperSingular, lowerSingular),
        GET: () => GET(lowerSingular, fieldsFunc),
        UPDATE: () => UPDATE(upperSingular),
        DELETE: () => DELETE(upperSingular),
        GET_ALL: () => GET_ALL(lowerPlural, fieldsFunc)
    };
}
