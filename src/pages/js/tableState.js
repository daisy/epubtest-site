// maintain search, filter, sort state for all tables
// optionally restore state data on back/forward/reload

// state is stored in localStorage

// localStorage.getItem(document.URL)

/* 
[
    {
        tableId: 'results',
        settings: {
            sort: {
                index: 0,
                dir: 'ascending' | 'descending'
            },
            filters: [
                {
                    id: selectElementId, 
                    value: selectedvalue
                },
                
            ],
            searchText
        }
    },
]
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
    if (!localStorage.hasOwnProperty(URL)) {
        let newState = initNewTableState(tableId);
        localStorage.setItem(URL, JSON.stringify([newState]));    
    }
    let tablesForPage = JSON.parse(localStorage.getItem(URL));
    let targetTable = tablesForPage.find(t => t.tableId == tableId);
    if (!targetTable) {
        console.log("Could not find table settings for " + tableId);
        let newState = initNewTableState(tableId);
        tablesForPage.push(newState);
        localStorage.setItem(URL, JSON.stringify(tablesForPage));
    }
    return targetTable;
}
function storeTableStateForPage(URL, tableId, tableState) {
    let tablesForPage = JSON.parse(localStorage.getItem(URL));
    let i = tablesForPage.findIndex(t => t.tableId == tableId);
    tablesForPage[i] = {...tableState};
    localStorage.setItem(URL, JSON.stringify(tablesForPage));
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