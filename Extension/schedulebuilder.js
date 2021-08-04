const main = document.getElementsByTagName('main')[0];
(async () => {
    // synchronously get professor data from chrome storage to ensure we have it for observer
    const profs = await new Promise((resolve, reject) =>
        chrome.storage.local.get('professors', ({ professors }) =>
            resolve(professors)
        )
    );
    // observe changes so that we modify the table once it appears
    new MutationObserver(() => checkUrl(profs))
        .observe(main, { childList: true });
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
    new MutationObserver((mutations, observer) => {
        observer.disconnect();
        new MutationObserver((mutations, observer) => {
            if (document.getElementById('enabled_panel'))
                modifyTable(professors, tables, false);
        }).observe(main.firstChild.childNodes.item(2), { childList: true });
        modifyTable(professors, tables, false);
    }).observe(main.firstChild, { childList: true });
}

function modifyTable(professors, tables, isMainPage) {
    // on the main page the desired table is index 1, on the options page it is index 0
    const table = isMainPage ? 1 : 0;
    const profNameIndex = isMainPage ? 6 : 5;
    [...tables[table].children].map(el => {
        const profNameNode = el.firstChild.childNodes.item(profNameIndex);
        // table header row
        if (el.tagName === 'THEAD') {
            const table_el = document.createElement('th');
            // add the css class that ScheduleBuilder uses
            table_el.classList.add('css-0');
            table_el.innerText = 'Rating';
            el.firstChild.insertBefore(table_el, profNameNode.nextSibling);
        }
        // table body rows
        else {
            const profData = professors[profNameNode.innerText];
            const table_el = document.createElement('th');
            // add the css class that ScheduleBuilder uses
            table_el.classList.add('css-7aef91-cellCss');
            // add the professor's rating to the table
            table_el.innerHTML = `<span>${profData.rating}</span>`;
            el.firstChild.insertBefore(table_el, profNameNode.nextSibling);

            // there is a popup whose colSpan must be increased to make it not look weird
            el.childNodes.item(2).firstChild.colSpan = 12;
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