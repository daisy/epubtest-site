/* 
Turns an HTML table into one with sorting, filtering, and searching

Depends on dayjs if you want to sort by date
*/

// sorting utility functions
let sortHelpers = {
    "alpha": (row1, row2, path) => {
        let val1 = path(row1);
        let val2 = path(row2);
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
        let val1 = path(row1);
        let val2 = path(row2);

        if (dayjs(val1).isBefore(dayjs(val2))) {
            return -1;
        }
        else {
            return 1;
        }

    }
};

class EnhancedTable  {
    
    // tableElement must have a thead and tbody
    // controlsElement must be an empty div
    constructor(tableElement, controlsElement, idString="") {
        this.tableElm = tableElement;
        this.controlsElm = controlsElement;
        this.originalTBodyInnerHTML = tableElement.querySelector("tbody").innerHTML;
        this.filters = [];
        this.sortRules = [];
        this.searchText = '';
        this.sortByIndex = 0;
        this.idString = idString ? `-${idString}` : ''; // identifier for when there are multiple tables on a page
        this.initFilters();
    }

    initFilters() {
        this.controlsElm.innerHTML = `
        <fieldset class="table-filters hidden">
            <legend class="visually-hidden">Filters</legend>
            <div id="table-search${this.idString}" class="hidden">
                <label for="table-search-input${this.idString}">Search</label>
                <input type="text" id="table-search-input${this.idString}" name="table-search-input">
            </div>
            <button id="reset${this.idString}" class="hidden">Reset</button>
        </fieldset>`;
        this.controlsElm.querySelector(`#table-search-input${this.idString}`).addEventListener("keyup", e => {
            if (e.keyCode == 27) { // escape
                this.searchText = '';
                e.target.value = '';
                this.refreshRows();
            }

            this.searchText = e.target.value;
            this.refreshRows();
        });
        this.controlsElm.querySelector(`#reset${this.idString}`).addEventListener("click", e => this.reset());
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
                columnHeader.setAttribute("title", `Sort by ${columnHeaderText}`);
                let innerHTML = columnHeader.innerHTML;
                // wrap with a button
                columnHeader.innerHTML = `<span tabindex="0" role="button">${innerHTML}</span>`;
                // attach a listener
                columnHeader.addEventListener('click', e => {
                    let ariaSort = columnHeader.getAttribute("aria-sort");
                    // remove aria-sort from the other headers
                    columnHeaders.map(ch => ch.removeAttribute("aria-sort"));
                    
                    // change the sort direction
                    if ((ariaSort && ariaSort == "ascending") || 
                        (!ariaSort && sortRule.firstSort == "descending")) {
                        columnHeader.setAttribute("aria-sort", "descending");
                    }
                    else {
                        columnHeader.setAttribute("aria-sort", "ascending");
                    }
        
                    this.sortByIndex = idx;
                    this.refreshRows();
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
        this.controlsElm.querySelector(`#reset${this.idString}`).classList.remove("hidden");
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
            newFilter.innerHTML = `
            <label for="filter-${idx}-${this.idString}">${filterRule.label}</label>
            <select id="filter-${idx}-${this.idString}">
                ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
            </select>
            `;
            this.controlsElm.querySelector("fieldset").insertBefore(newFilter, 
                this.controlsElm.querySelector(`#table-search${this.idString}`));
            
        }).join('');
        
        Array.from(this.controlsElm.querySelectorAll("select")).map(selectElm => selectElm.addEventListener("change", e => {
            this.refreshRows();
        }));
    }
    
    enableSearch() {
        this.controlsElm.querySelector("fieldset").classList.remove("hidden");
        this.controlsElm.querySelector(`#reset${this.idString}`).classList.remove("hidden");
        this.controlsElm.querySelector(`#table-search${this.idString}`).classList.remove('hidden');
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
        let sortRule = this.sortRules.find(sr => sr.columnIndex == this.sortByIndex);
        if (!sortRule) {
            return rows;
        }
        let columnHeaders = Array.from(this.tableElm.querySelectorAll(`thead th`));
        let columnHeader = columnHeaders[this.sortByIndex];
        
        // sort the rows
        let sortFn = sortHelpers[sortRule.type];
        tableRows.sort((a, b) => sortFn(a, b, sortRule.pathFn));
        
        if (columnHeader.getAttribute("aria-sort") == "descending") {
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
            return trStr.indexOf(this.searchText.toLowerCase().trim()) != -1;
        });
        return rowsContainingSearchText;
    }
    refreshRows() {
        let tbody = this.tableElm.querySelector("tbody");
        tbody.innerHTML = this.originalTBodyInnerHTML; // start with the full set of rows
        let tableRows = Array.from(this.tableElm.querySelectorAll("tbody tr"));
        tableRows = this.filterRows(tableRows); // apply the filters
        tableRows = this.searchRows(tableRows); // apply the text search
        tableRows = this.sortRows(tableRows); // sort the rows
        
        let rowsHTML = tableRows.map(row => row.outerHTML).join('');
        this.tableElm.querySelector("tbody").innerHTML = rowsHTML;

        let size = this.getSize();
        this.tableElm.setAttribute("aria-colcount", size.columns);
        this.tableElm.setAttribute("aria-rowcount", size.rows);
    }
    reset() {
        this.tableElm.querySelector("tbody").innerHTML = this.originalTBodyInnerHTML;
        this.controlsElm.querySelector(`#table-search-input${this.idString}`).value = '';
        this.searchText = '';
        Array.from(this.controlsElm.querySelectorAll("select")).map(selectElm => selectElm.value = "All");
        this.refreshRows();
    }
    // number of cols/rows for current state (filtered etc)
    getSize() {
        let columns = this.tableElm.querySelectorAll("thead th").length;
        let rows = this.tableElm.querySelectorAll("tbody > tr").length;
        return {columns, rows};
    }
    
}

export { EnhancedTable };