// this module is adapted from the last version, which used a JSON string of settings in local storage
// we moved this to the search params instead and made it more readable than raw JSON
/*
tableId=str
sortBy=num
sortDir='asc|desc'
filterId=filterValue
searchText=''
...repeat for multiple tables
*/
function getSearchText(URL, tableId) {
    let state = getTableStateForPage(URL, tableId);
    return state?.searchText ?? '';
}
function getSort(URL, tableId) {
    let state = getTableStateForPage(URL, tableId);
    return state?.sort ?? {};
}
function getFilters(URL, tableId) {
    let state = getTableStateForPage(URL, tableId);
    return state?.filters ?? [];
}
function getFilterValue(URL, tableId, filterId) {
    let state = getTableStateForPage(URL, tableId);
    let filter = state.filters.find(f => f.id == filterId);
    return filter?.value ?? '';
}

function storeSortIndex(URL, tableId, sortIndex) {
    storeSort(URL, tableId, sortIndex, null);
}
function storeSortDir(URL, tableId, sortDir) {
    storeSort(URL, tableId, null, sortDir);
}
function storeFilterValue(URL, tableId, filterId, filterValue) {
    let tableState = getTableStateForPage(URL, tableId);
    let filter = tableState.filters.find(f => f.id == filterId);
    if (!filter) {
        tableState.filters.push({id: filterId, value: filterValue});
    }
    else {
        filter.value = filterValue;
    }
    storeTableStateForPage(URL, tableId, tableState);
}
function storeSearchText(URL, tableId, searchText) {
    let tableState = getTableStateForPage(URL, tableId);
    tableState.searchText = searchText;
    storeTableStateForPage(URL, tableId, tableState);
}


// pass null to sortIndex or sortDir to bypass setting that value (it just uses the stored value)
function storeSort(URL, tableId, sortIndex, sortDir) {
    let tableState = getTableStateForPage(URL, tableId);
    tableState.sort = {
        index: sortIndex ?? tableState.sort.index,
        dir: sortDir ?? tableState.sort.dir
    };
    storeTableStateForPage(URL, tableId, tableState);
}
function clearSort(URL, tableId) {
    let tableState = getTableStateForPage(URL, tableId);
    tableState.sort = {};
    storeTableStateForPage(URL, tableId, tableState);
}

let initNewTableState = tableId => ({
    tableId,   
    sort: null,
    filters: [],
    searchText: ''
});
function getTableStateForPage(URL, tableId) {
    let stateData = getStateSearchParam(tableId);

    return stateData.find(data => data.tableId == tableId);
    // let targetTable = stateData.find(t => t.tableId == tableId);
    // if (!targetTable) {
    //     // console.log("Could not find table settings for " + tableId);
    //     let newState = initNewTableState(tableId);
    //     let tablesForPage = [];
    //     tablesForPage.push(newState);
    //     setStateSearchParam(tablesForPage);
    // }
    // return targetTable;
}
function storeTableStateForPage(URL, tableId, tableState) {
    let tablesForPage = getStateSearchParam(tableId);
    let i = tablesForPage.findIndex(t => t.tableId == tableId);
    tablesForPage[i] = {...tableState};
    setStateSearchParam(tablesForPage);
}

// return the table's search parameters
function getStateSearchParam(tableId) {
    let searchParams = new URLSearchParams(document.location.search);
    let tableData = {tableId, sort: null, search: '', filters: []};
    if (!searchParams || searchParams.size == 0) {
        return [tableData];
    }
    // get all searchParams for the given table
    // they may be <table-id>-sort, -search, and any others are filters
    searchParams.forEach((value, key) => {
        if (key.indexOf(tableId) == 0) {
            let key_ = key.replace(`${tableId}-`, '');
            if (key_ == 'sort') {
                tableData.sort = value;
            }
            else if (key_ == 'search') {
                tableData.search = value;
            }
            else {
                tableData.filters.push({id: key_, value});
            }
        }
    });

    return [tableData];
}
// TODO rename this function and the one above it
function setStateSearchParam(value) {
    let url = new URL(window.location.href);
    value.map(data => {
        if (data.sort) {
            url.searchParams.set(`${data.tableId}-sort`, data.sort);
        }
        if (data.searchText) {
            url.searchParams.set(`${data.tableId}-search`, data.searchText);
        }
        if (data.filters.length > 0) {
            data.filters.map(filter => {
                if (filter.value == 'All') {
                    // don't record 'All' selections
                    // remove the param if exists
                    url.searchParams.delete(`${data.tableId}-${filter.id}`);
                }
                else {
                    url.searchParams.set(`${data.tableId}-${filter.id}`, filter.value);
                }
            });
        }
    });
    window.history.pushState(null, '', url.toString());
}

export { 
    getSort, 
    getFilters,
    getFilterValue,
    getSearchText,
    storeSortIndex,
    storeSortDir,
    storeFilterValue, 
    storeSearchText,
    clearSort
}