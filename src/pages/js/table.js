class table  {
    constructor() {
        this.data = [];
        this.tbody = null;
        this.currSortCol = -1;
        this.currSortDir = 'asc';
    }
    
    init (tbody, data, initialSortCol, initialSortDir) {
        console.log("init");
        this.tbody = tbody;
        this.data = data;
        this.currSortDir = initialSortDir;
        this.sortBy(initialSortCol);
    }

    render ()  {
        // just re-render tbody
        this.tbody.innerHTML = '';
        this.data.map(d => {
            let tr = document.createElement("tr");
            // the testing environment cell
            let tdTestenv = document.createElement("td");
            tdTestenv.classList.add("testenv");
            tdTestenv.innerHTML = 
                `<a href="/results/${d.testingEnvironment.id}">
                    ${d.testingEnvironment.readingSystem}
                </a>
                <a href="/results/${d.testingEnvironment.id}">
                    ${d.testingEnvironment.assistiveTechnology}
                </a>
                <a href="/results/${d.testingEnvironment.id}">
                    ${d.testingEnvironment.operatingSystem}
                </a>`;
            tr.appendChild(tdTestenv);

            // add the score cells
            d.results.map((r, idx) => {
                let td = document.createElement("td");
                if (r == -1) {
                    td.innerHTML = '<span class="notTested">Not tested</span>';
                }
                else {
                    td.textContent = `${r}%`;
                }
                tr.appendChild(td);
            });
            this.tbody.appendChild(tr);
        });
    }

    // mode = 'asc' or 'desc'
    sortBy(idx) {
        // if we're resorting the same column, do the opposite
        if (idx == this.currSortCol) {
            this.currSortDir = this.currSortDir == 'asc' ? 'desc' : 'asc';
        }
        this.currSortCol = idx;
        console.log(`${this.currSortCol} - ${this.currSortDir}`);
        // the first column has special rules
        this.data = this.data.sort((a,b) => {
            let aVal, bVal;
            if (idx == 0) {
                aVal = a.testingEnvironment.readingSystem;
                bVal = b.testingEnvironment.readingSystem;
            }
            else {
                aVal = a.results[idx-1];
                bVal = b.results[idx-1];
            }
            if (this.currSortDir == 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            }
            else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
        this.render();
    }
}

export {table}