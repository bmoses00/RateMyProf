(async () => {
    // synchronously get professor data from chrome storage to ensure we have it for observer
    const profs = await new Promise((resolve, reject) =>
        chrome.storage.local.get('professors', ({ professors }) =>
            resolve(professors)
        )
    );
    // observe changes so that we modify the table once it appears
    new MutationObserver(() => addProfessorRatings(profs))
        .observe(document.getElementsByTagName('main')[0], { childList: true });
})();

function addProfessorRatings(professors) {
    // the reason we use REGEX matching inside the observer instead in manifest.json
    //  script is that matching subdirectories in manifest.json is unreliable
    const url = window.location.href;
    const main_page_pattern = 'https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/(courses(?!tatuses)|options)';
    const class_options_pattern = 'https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/courses\/.*';

    const tables = document.getElementsByTagName('table');

    // check if URL is correct and that the table has loaded
    if (url.match(main_page_pattern) && tables.length > 0) {
        modifyTable(professors, tables, true);
    }
    // our first observer will catch when the options page begins loading, but not 
    // when it finishes loading. To avoid the expensive { subtree: true } observer option,
    // we create another observer which will disconnect when page finishes loading 
    else if (url.match(class_options_pattern)) {
        new MutationObserver((mutations, observer) => {
            observer.disconnect();
            modifyTable(professors, tables, false);
        }).observe(document.getElementsByTagName('main')[0].firstChild, { childList: true });
    }
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
            el.firstChild.insertBefore(table_el, profNameNode);
        }
        // table body rows
        else {
            const profData = professors[profNameNode.innerText];
            const table_el = document.createElement('th');
            // add the css class that ScheduleBuilder uses
            table_el.classList.add('css-7aef91-cellCss');
            // add the professor's rating to the table
            table_el.innerHTML = `<span>${profData.rating}</span>`;
            el.firstChild.insertBefore(table_el, profNameNode);

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