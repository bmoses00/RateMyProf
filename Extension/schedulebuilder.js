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
    const main_page_pattern = 'https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/(courses(?!tatuses)|options)';
    const class_options_pattern = 'https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/courses\/.*';

    const tables = document.getElementsByTagName('table');

    // check if URL matches the main page and that the table has loaded
    if (url.match(main_page_pattern) && tables.length > 0) {
        modifyTableMainPage(professors, tables);
    }
    else if (url.match(class_options_pattern)) {
        modifyTableOptionsPage(professors, tables);
    }
}

function modifyTableMainPage(professors, tables) {
    modifyTable(professors, tables, true);
}
function modifyTableOptionsPage(professors, tables) {
    // once we've clicked on the page, we need to wait for it to load before modifying its table.
    // for that, we need another mutation observer. Within that observer we need another to observe
    // one element which can trigger table reconstruction, and another that opens yet another 
    // tab which can trigger table reconstruction

    // observe the table for changes. Since the table is destroyed and recreated, we must 
    // attach this observer to the table every time it is recreated
    const tableObserver = new MutationObserver(() => {
        console.log('table changed');
        modifyTable(professors, tables, false, !!document.getElementById('enabled_panel'));
    });


    const onPageChange = () => {
        tableObserver.observe(tables[0], observerConfig);
        // if the correct table is being displayed and we haven't already added columns to it
        // console.log(tables[0].firstChild.firstChild.children.length);
        // if (document.getElementById('enabled_panel') && tables[0].firstChild.firstChild.children.length === DEFAULT_TABLE_WIDTH)
        modifyTable(professors, tables, false, !!document.getElementById('enabled_panel'));
    }
    const pageChangeObserver = new MutationObserver(onPageChange);


    const onPageLoad = (mutations, observer) => {
        observer.disconnect();
        pageChangeObserver.observe(main.firstChild.children[2], observerConfig);
        modifyTable(professors, tables, false, true);
    }
    const pageLoadObserver = new MutationObserver((mutations, observer) => onPageLoad(mutations, observer));
    pageLoadObserver.observe(main.firstChild, observerConfig);
}

function modifyTable(professors, tables, isMainPage = false, isEnabledPanel = false) {
    // there are different values for table number, index of professor name in table, table with for
    // the different tables on the site
    const table = isMainPage ? 1 : 0;
    let profNameIndex = isMainPage ? 6 : 5;
    if (!isMainPage && !isEnabledPanel) profNameIndex--;
    const default_table_width = isEnabledPanel ? 10 : 9;

    [...tables[table].children].map(row => {
        // if this row hasn't been modified before. We check per row because some rows 
        // may be modified and others not
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
                console.log(profData);
                if (profData === undefined || profData.num_ratings === "0") profData = noData;
                const table_col = document.createElement('th');
                // add the css class that ScheduleBuilder uses
                table_col.classList.add('css-7aef91-cellCss');
                // add the professor's rating to the table
                table_col.innerHTML = `<span>${profData.rating}</span>`;
                row.firstChild.insertBefore(table_col, profNameNode.nextSibling);

                // there is a popup whose colSpan must be increased to make it not look weird
                row.children[2].firstChild.colSpan = 12;
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