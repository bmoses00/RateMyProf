const main = document.getElementsByTagName('main')[0];
const observerConfig = { childList: true };


(async () => {
    // synchronously get professor data from chrome storage to ensure we have it for observer
    const profs = await new Promise((resolve, reject) =>
        chrome.storage.local.get('professors', ({ professors }) =>
            resolve(professors)
        )
    );
    // observe changes so that we modify the table once it appears
    const observer = new MutationObserver(() => checkUrl(profs));
    observer.observe(main, observerConfig);
})();


function checkUrl(professors) {
    //  use REGEX matching inside the observer because matching subdirectories in manifest.json is unreliable
    const url = window.location.href;
    const landing_page_pattern = 'https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/(courses(?!tatuses)|options|schedules(?!.+)|breaks)';
    const class_options_pattern = 'https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/courses\/.*';
    const schedule_page_pattern = 'https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/schedules\/.+';

    const tables = document.getElementsByTagName('table');

    url.match(landing_page_pattern)  ? handleLandingPageChanges(professors, tables)  :
    url.match(class_options_pattern) ? handleOptionsPageChanges(professors, tables)  :
    url.match(schedule_page_pattern) ? handleSchedulePageChanges(professors, tables) : ''
}


function handleLandingPageChanges(professors, tables) {
    modifyTable(professors, tables, true);
}

function handleOptionsPageChanges(professors, tables) {
    // observes changes to the table and calls modifyTable() when changes are detected
    const tableObserver = new MutationObserver(
        () => modifyTable(professors, tables, false, !!document.getElementById('enabled_panel'))
    );
    // whenever the page changes call modifyTable(), and also reattach the table observer since 
    // the table is destroyed and recreated on page change
    const onPageChange = () => {
        tableObserver.observe(tables[0], observerConfig);
        modifyTable(professors, tables, false, !!document.getElementById('enabled_panel'));
    }
    const pageChangeObserver = new MutationObserver(onPageChange);
    // once the page and the table finish loading, disconnect the observer (it was just to wait 
    // for page load), activate the observer for changes in the page, and call modifyTable()
    const onPageLoad = (mutations, observer) => {
        observer.disconnect();
        pageChangeObserver.observe(main.firstChild.children[2], observerConfig);
        modifyTable(professors, tables, false, true);
    }
    const pageLoadObserver = new MutationObserver((mutations, observer) => onPageLoad(mutations, observer));
    pageLoadObserver.observe(main.firstChild, observerConfig);
}

function handleSchedulePageChanges(professors, tables) {
    // div with the information on SBU classes
    const days = document.getElementsByClassName('css-54eexc-daysCss')[0].children;
    // uses the 'days' div to get which class each professor is teaching
    const getProfsClasses = () => {
        const profsClasses = {};
        // we need to loop through all grandchildren of the 'days' element
        [...days].map(day => {
            [...day.children].map(SBUclass => {
                // we use this information to figure out which class which professor is teaching
                const classInfo = [...SBUclass.firstChild.lastChild.children].slice(-2)[0].innerText.split('\n');
                profsClasses[classInfo[0]] = classInfo[2];
            });
        });
        return profsClasses;
    }
    // given the special behavior of the table in the 'schedule' page, we have a special modifyTable() function
    modifyTableScheduleTab(professors, tables, getProfsClasses());
    // whenever the schedule changes, modify the new table
    const scheduleObserver = new MutationObserver(() => modifyTableScheduleTab(professors, tables, getProfsClasses()));

    // add event listeners to detect when the schedule changes
    [...days].map(day => {
        scheduleObserver.observe(day, observerConfig);
    });
}


function modifyTable(professors, tables, isMainPage = false, isEnabledPanel = false) {
    // there are different values for index of professor name and for table width
    // for the different tables on the site
    const profNameIndex = isMainPage ? 6 : isEnabledPanel ? 5 : 4;
    const default_table_width = isEnabledPanel ? 10 : 9;

    [...tables[tables.length - 1].children].map(row => {
        // only add to the row if it hasn't been modified from its default width
        if (row.firstChild.children.length === default_table_width) {
            const profNameNode = row.firstChild.children[profNameIndex];;
            
            // table header row
            if (row.tagName === 'THEAD') {
                const table_col = document.createElement('th');
                // add the css class that ScheduleBuilder uses
                table_col.classList.add('css-0');
                table_col.innerText = 'Rating';
                row.firstChild.insertBefore(table_col, profNameNode.nextSibling);
            }
            // table body rows
            else {
                const noData = {
                    difficulty: "No data",
                    href: "No data",
                    num_ratings: "No data",
                    rating: "No data",
                    would_take_again: "No data"
                }
                let profData = professors[profNameNode.innerText];
                if (profData === undefined || profData.num_ratings === "0") profData = noData;
                const table_col = document.createElement('th');
                // add the css class that ScheduleBuilder uses
                table_col.classList.add('css-7aef91-cellCss');
                // add the professor's rating to the table
                table_col.innerHTML = `<span>${profData.rating}</span>`;
                row.firstChild.insertBefore(table_col, profNameNode.nextSibling);

                // there is a popup whose colSpan must be increased to make it not look weird
                row.children[2].firstChild.colSpan = 12;
                // on this specific table, increase the colSpan of this element
                if (!isMainPage && !isEnabledPanel) 
                    row.lastChild.firstChild.colSpan = 12;
            }
        }
    });
}

function modifyTableScheduleTab(professors, tables, profsClasses) {
    const default_table_width = 13;
    [...tables[tables.length - 1].children].map(row => {
        if (row.firstChild.children.length === default_table_width) {
            if (row.tagName === 'THEAD') {
                const rating_col = document.createElement('th');
                // add the css class that ScheduleBuilder uses
                rating_col.classList.add('css-0');
                rating_col.innerText = 'Rating';
                row.firstChild.insertBefore(rating_col, row.firstChild.children[8]);

                const professor_col = document.createElement('th');
                // add the css class that ScheduleBuilder uses
                professor_col.classList.add('css-0');
                professor_col.innerText = 'Professor';
                row.firstChild.insertBefore(professor_col, row.firstChild.children[8]);
            }
            else if (row.tagName === 'TBODY') {
                const className = row.firstChild.children[6].innerText + '-' + row.firstChild.children[7].innerText;
                const profName = profsClasses[className];

                const noData = {
                    difficulty: "No data",
                    href: "No data",
                    num_ratings: "No data",
                    rating: "No data",
                    would_take_again: "No data"
                }
                let profData = professors[profName];
                if (profData === undefined || profData.num_ratings === "0") profData = noData;

                const rating_col = document.createElement('th');
                // add the css class that ScheduleBuilder uses
                rating_col.classList.add('css-7aef91-cellCss');
                // add the professor's rating to the table
                rating_col.innerHTML = `<span>${profData.rating}</span>`;
                row.firstChild.insertBefore(rating_col, row.firstChild.children[8]);

                const professor_col = document.createElement('th');
                // add the css class that ScheduleBuilder uses
                professor_col.classList.add('css-7aef91-cellCss');
                // add the professor's rating to the table
                professor_col.innerHTML = `<span>${profName}</span>`;
                row.firstChild.insertBefore(professor_col, row.firstChild.children[8]);

                // there is a popup whose colSpan must be increased to make it not look weird
                row.children[2].firstChild.colSpan = 15;
            }
            else {
                row.firstChild.firstChild.colSpan = 14;
            }
        }
    });
}


// converts DOM object -> JS object -> String -> JS object then logs it to ensure 
// console output doesn't change. Code not original.
function logDomObject(element) {
    console.log(JSON.parse(JSON.stringify(stringify(element), null, '')));
}

function stringify(element) {
    let obj = {};
    obj.name = element.localName;
    obj.attributes = [];
    obj.children = [];
    Array.from(element.attributes).forEach(a => {
        obj.attributes.push({ name: a.name, value: a.value });
    });
    Array.from(element.children).forEach(c => {
        obj.children.push(stringify(c));
    });

    return obj;
}