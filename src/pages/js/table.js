/* 
Turns an HTML table into one with sorting, filtering, and searching

Depends on dayjs if you want to sort by date
*/
// import * as TableState from './tableState.js';
// import * as TableState from './tableStateQP.js';
// sorting utility functions
let sortHelpers = {
    "alpha": (row1, row2, path) => {
        let val1 = path(row1).trim();
        let val2 = path(row2).trim();
        if (!val1) return 1;
        if (!val2) return -1;
        return val1.toLowerCase() > val2.toLowerCase() ? 1 : -1;
    },

    "numeric": (row1, row2, path) => {
        let val1 = path(row1);
        let val2 = path(row2);
        if (val1 == null) return 1;
        if (val2 == null) return -1;
        return val1 > val2 ? 1 : -1;
    },

    "date": (row1, row2, path) => {
        let val1 = path(row1).trim();
        let val2 = path(row2).trim();

        if (val1 == '' || dayjs(val1).isBefore(dayjs(val2))) {
            return -1;
        }
        else {
            return 1;
        }

    }
};

let docurl = () => {
    let url = new URL(document.URL);
    return `${url.protocol}//${url.host}${url.pathname}`;
};
// sortStr is formatted as index-dir eg 3-a or 0-d
let parseSort = sortStr => {
    if (!sortStr || sortStr == '' || !sortStr.split(['-']) || sortStr.split(['-']).length != 2) {
        return null;
    }
    let index = sortStr.split(['-'])[0];
    let dir = sortStr.split(['-'])[1] == 'a' ? 'ascending' : 'descending';
    return {index, dir};
}
let setURLSearchParam = (id, value) => {
    let url = new URL(window.location.href);
    url.searchParams.set(id.trim(), value.trim());
    window.history.pushState(null, '', url.toString());
};
    
let getURLSearchParam = id => {
    let url = new URL(window.location.href);
    return url.searchParams.get(id.trim());
};

let clearURLSearchParam = id => {
    let url = new URL(window.location.href);
    url.searchParams.delete(id.trim());
    window.history.pushState(null, '', url.toString());
};
let rowOrRows = length => length == 1 ? 'row' : 'rows';

class EnhancedTable  {
    
    // tableElement must have a thead and tbody
    // controlsElement must be an empty div
    constructor(tableElement, controlsElement, idString="") {
        this.tableElm = tableElement;
        this.controlsElm = controlsElement;
        this.originalTBodyInnerHTML = tableElement.querySelector("tbody").innerHTML;
        this.sortRules = [];
        this.idString = idString ? `-${idString}` : ''; // identifier for when there are multiple tables on a page
        this.initFilters();
        
        // cleaning up after ourselves -- 
        // clear local storage for this page since the site uses only query params for table sort/filter now
        localStorage.removeItem(docurl());
    }

    ID = (str) => `${str}${this.idString}`;

    // URL string values
    /* 
    search=string
    sort=index-dir e.g. 1-a or 4-d
    filterid=value
    */

    // get values from the URL
    getSearchText = () => getURLSearchParam(this.ID('search')) || '';
    getSort = () => getURLSearchParam(this.ID('sort'));
    getFilter = (filterId) => getURLSearchParam(filterId);
    clearSort = () => clearURLSearchParam(this.ID('sort'));
    setSort = (index, dir) => setURLSearchParam(this.ID('sort'), `${index}-${dir == "ascending" ? 'a' : 'd'}`);
    setFilter = (filterId, value) => {
        if (value == 'All') {
            clearURLSearchParam(filterId);
        }
        else {
            setURLSearchParam(filterId, value);
        }
    }
    
    setInitFilterValue = (filterId, value) => {
        // only set the value if the filter doesn't already have an entry
        if (getURLSearchParam(filterId) == null && value != 'All') {
            setURLSearchParam(filterId, value);
        }
    };
    setSearchText = str => str != '' ? setURLSearchParam(this.ID('search'), str) : clearURLSearchParam(this.ID('search'));

    

    clearFilters = () => {
        let filters = this.getFilters();
        filters.map(f => this.setFilter(f.id, "All"));
    };

    initFilters() {
        this.controlsElm.innerHTML = `
        <fieldset class="table-filters hidden">
            <legend class="visually-hidden">Filters</legend>
            <div id="${this.ID('search-container')}" class="hidden">
                <label for="${this.ID('search')}">Search</label>
                <input type="text" id="${this.ID('search')}" value="${this.getSearchText() || '' }">
            </div>
            <button id="${this.ID('reset')}" class="hidden">Reset</button>
            <span class="rowcount" id="rowcount${this.idString}"><span>${this.tableElm.querySelectorAll('tbody tr').length}</span> ${rowOrRows(this.tableElm.querySelectorAll('tbody tr').length)} shown.</span>
        </fieldset>`;
        this.controlsElm.querySelector(`#${this.ID('search')}`).addEventListener("keyup", e => {
            if (e.keyCode == 27) { // escape
                e.target.value = '';
            }
            this.setSearchText(e.target.value);
            this.refreshTable();
        });
        this.controlsElm.querySelector(`#${this.ID('reset')}`).addEventListener("click", e => this.reset());
    }
    
    /* sortRules = [{
        columnIndex, 
        type: "alpha" | "numeric", 
        pathFn: func to get value given a row,
        firstSort: "ascending" | "descending"
    }, ...]*/
    enableSort(sortRules) {
        let columnHeaders = Array.from(this.tableElm.querySelectorAll("thead th"));
        this.sortRules = sortRules;
        sortRules.map(sortRule => {
            let idx = sortRule.columnIndex;
            if (idx < 0 || idx > columnHeaders.length - 1) {
                console.error(`enableSort columnIndex ${idx} out of range`);
            }
            else {
                let columnHeader = columnHeaders[idx];
                let columnHeaderText = columnHeader.textContent;
                // add sort info to the column header
                columnHeader.classList.add("sortable");
                columnHeader.setAttribute("title", `Sort by ${columnHeaderText.trim()}`);
                let innerHTML = columnHeader.innerHTML;
                // wrap with a button
                columnHeader.innerHTML = `<span tabindex="0" role="button">${innerHTML}</span>`;
                // attach a listener
                columnHeader.addEventListener('click', e => {
                    let newSortDirValue = "ascending";
                    // this column was sorted
                    if (columnHeader.hasAttribute("aria-sort")) {
                        if (columnHeader.getAttribute("aria-sort") == "ascending") {
                            newSortDirValue = "descending";
                        }
                    }
                    // this column was not sorted already
                    else {
                        // this column's default should be descending
                        if (sortRule.firstSort == "descending") {
                            newSortDirValue = "descending";
                        }
                    }
                    this.setSort(idx, newSortDirValue);
                    this.refreshTable();
                });
            }
        });
    }
    
    /* filterRules = [{
        label, 
        pathFn: function to find the data given a row
    }]
    */
    enableFilters(filterRules) {
        this.filterRules = filterRules;
        this.controlsElm.querySelector("fieldset").classList.remove("hidden");
        this.controlsElm.querySelector(`#${this.ID('reset')}`).classList.remove("hidden");
        this.filterRules.map((filterRule, idx) => {

            // all the possible values
            let rows = Array.from(this.tableElm.querySelectorAll("tbody tr"));
            let allValues = Array.from(
                                new Set(
                                    rows.map(row => filterRule.pathFn(row))
                                    .map(value => value == null || value == "" ? "None" : value) // replace null or "" with "None"
                                ));
            let hasNone = allValues.indexOf("None") != -1;
            if (hasNone) {
                allValues.splice(allValues.indexOf("None"), 1);
            }
            allValues.sort((a, b) => {
                if (a.toLowerCase() > b.toLowerCase()) {
                    return 1;       
                }
                else {
                    return -1;
                }
            });
            let options = ["All", ...allValues];
            if (hasNone) {
                options.push("None");
            }
            let newFilter = document.createElement("div");
            // make the filterId from the filter label plus the table ID string if present
            let filterId = `${filterRule.label.toLowerCase().replaceAll(' ', '-')}${this.idString}`;//`filter-${idx}-${this.idString}`;
            newFilter.innerHTML = `
            <label for="${filterId}">${filterRule.label}</label>
            <select id="${filterId}">
                ${options.map(option => `<option 
                    value="${option}" 
                    ${this.getFilter(filterId) && this.getFilter(filterId) == option ? 'selected' : ''}>
                ${option}</option>`).join('')}
            </select>
            `;
            this.setInitFilterValue(filterId, this.getFilter(filterId) || "All"); 
            this.controlsElm.querySelector("fieldset").insertBefore(newFilter, 
                this.controlsElm.querySelector(`#${this.ID('search-container')}`));
            
        }).join('');
        this.refreshTable();

        Array.from(this.controlsElm.querySelectorAll("select")).map(selectElm => selectElm.addEventListener("change", e => {
            this.setFilter(selectElm.id, e.target.value);
            this.refreshTable();
        }));
    }
    
    enableSearch() {
        this.controlsElm.querySelector("fieldset").classList.remove("hidden");
        this.controlsElm.querySelector(`#${this.ID('reset')}`).classList.remove("hidden");
        this.controlsElm.querySelector(`#${this.ID('search-container')}`).classList.remove('hidden');
    }
    filterRows(rows) {
        let selectElms = Array.from(this.controlsElm.querySelectorAll("select"));
        let tableRows = rows;
        selectElms.map((selectElm, idx) => {
            let filterRule = this.filterRules[idx];
            tableRows = tableRows.filter(tr => {
                let value = filterRule.pathFn(tr);
                return selectElm.value == "All" 
                    || (selectElm.value == "None" && (value == null || value == "")) 
                    || (value.toLowerCase() == selectElm.value.toLowerCase());
            });
        });
        return tableRows;
    }
    sortRows(rows) {
        let tableRows = rows;
        if (this.sortRules.length == 0) {
            return rows;
        }
        let sortParam = parseSort(this.getSort());
        if (!sortParam) {
            return rows;
        }
        let sortRule = this.sortRules.find(sr => sr.columnIndex == sortParam.index);
        if (!sortRule) {
            return rows;
        }
        
        // sort the rows
        let sortFn = sortHelpers[sortRule.type];
        tableRows.sort((a, b) => sortFn(a, b, sortRule.pathFn));
        
        if (sortParam.dir == "descending") {
            tableRows = tableRows.reverse();
        }
        return tableRows;
    }
    searchRows(rows) {
        let rowsContainingSearchText = rows.filter(tr => {
            let tds = Array.from(tr.querySelectorAll("td"));
            let trStr = tds.map(td => 
                td.textContent
                    .replace(/[\n\r]+|[\s]{1,}/g, ' ')
                    .replace(/[\s]{2}/g, " ")
                    .trim().toLowerCase()
                ).join(' ');
            return trStr.indexOf(this.getSearchText().toLowerCase().trim()) != -1;
        });
        return rowsContainingSearchText;
    }
    refreshTable() {
        let columnHeaders = Array.from(this.tableElm.querySelectorAll("thead th"));
        // remove aria-sort from all headers
        columnHeaders.map(ch => ch.removeAttribute("aria-sort"));
        let sortParam = parseSort(this.getSort());
        if (sortParam) {
            let sortIndex = sortParam.index;
            if (sortIndex > 0 && sortIndex < columnHeaders.length) {
                let columnHeader = columnHeaders[sortIndex];
                columnHeader.setAttribute("aria-sort", sortParam.dir);
            }
        }

        let tbody = this.tableElm.querySelector("tbody");
        tbody.innerHTML = this.originalTBodyInnerHTML; // start with the full set of rows
        let tableRows = Array.from(this.tableElm.querySelectorAll("tbody tr"));
        let initialCount = tableRows.length;
        tableRows = this.filterRows(tableRows); // apply the filters
        tableRows = this.searchRows(tableRows); // apply the text search
        tableRows = this.sortRows(tableRows); // sort the rows
        
        let rowsHTML = tableRows.map(row => row.outerHTML).join('');
        this.tableElm.querySelector("tbody").innerHTML = rowsHTML;

        let size = this.getSize();
        this.tableElm.setAttribute("aria-colcount", size.columns);
        this.tableElm.setAttribute("aria-rowcount", size.rows);
        this.controlsElm.querySelector(`#rowcount${this.idString}`).innerHTML = `<span class="rowcount" id="rowcount${this.idString}">
            <span>${size.rows}</span> 
            ${rowOrRows(size.rows)} shown.
        </span>`;

        let filteredDescription = ": filtered view";
        let baseTitle = document.title.replaceAll(filteredDescription, '');
        if (initialCount > tableRows.length) {
            document.title = `${baseTitle}${filteredDescription}`;
        }
        else {
            document.title = baseTitle;
        }
    }
    reset() {
        this.tableElm.querySelector("tbody").innerHTML = this.originalTBodyInnerHTML;
        this.controlsElm.querySelector(`#${this.ID('search')}`).value = '';
        clearURLSearchParam(this.ID('search'));
        Array.from(this.controlsElm.querySelectorAll("select")).map(selectElm => {
            selectElm.value = "All";
            this.setFilter(selectElm.id, "All");
        });
        this.refreshTable();
    }
    // number of cols/rows for current state (filtered etc)
    getSize() {
        let columns = this.tableElm.querySelectorAll("thead th").length;
        let rows = this.tableElm.querySelectorAll("tbody > tr").length;
        return {columns, rows};
    }
    // // the "store" at the moment is just the URL search params
    // // it used to be localstorage hence some of the function names
    // loadFromStore() {
        
    //     if (this.getFilters()) {
    //         let filters = this.getFilters();
    //         filters.map(filter => {
    //             let select = this.controlsElm.querySelector("#" + filter.id);
    //             if (select) {
    //                 let options = Array.from(select.querySelectorAll('option'));
    //                 let option = options?.find(opt => opt.value == filter.value);
    //                 if (option) {
    //                     option.selected = true;
    //                 }
    //             }
    //         });
    //     }
    //     this.refreshTable();
    // }
    loadFromStore() {

    }
}

export { EnhancedTable };