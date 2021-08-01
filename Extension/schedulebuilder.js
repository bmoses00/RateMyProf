// set visibility to false, modify the data, then set visiblity back to true.. unnecessary?
// make it so everything isn't wrapped inside of a chrome get or a mutation observer
(async () => {
    const profs = await new Promise((resolve, reject) =>
        chrome.storage.local.get('professors', ({ professors }) =>
            resolve(professors)
        )
    );
    new MutationObserver(() => observeMainPage(profs))
        .observe(document.getElementsByTagName('main')[0], { childList: true });
})();

function observeMainPage(professors) {
    /* the reason we use REGEX matching inside the observer instead in manifest.json
        script is that matching subdirectories in manifest.json is unreliable*/
    const url = window.location.href;
    const main_page_pattern = 'https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/(courses|options)';
    // const 

    const tables = document.getElementsByTagName('table');
    // check if URL is correct and that the table has loaded
    if (url.match(main_page_pattern) && tables.length > 0) {
        // table 1 contains the professor names we want
        [...tables[1].children].map(el => {
            const profNameNode = el.firstChild.childNodes.item(6);
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
                table_el.innerHTML = `<span>${profData.rating}</span>`;
                el.firstChild.insertBefore(table_el, profNameNode);

                // there is a popup whose colSpan must be increased to make it not look weird
                el.childNodes.item(2).firstChild.colSpan = 12;
            }
        });
    }
}





// chrome.storage.local.get('professors', ({ professors }) => {
//     new MutationObserver((mutations, observer) => {
//         // console.log(document.getElementsByTagName(/*'main'*/'html')[0]);
//         // console.log(JSON.stringify(document.getElementsByTagName(/*'main'*/'html')[0]));
//         console.log(JSON.parse(JSON.stringify(stringify(document.getElementsByTagName('main')[0], null, ' '))));
//         console.log(document.getElementsByTagName('table')[0]);
//         // console.log(JSON.parse(JSON.stringify(document.getElementsByTagName(/*'main'*/'html')[0])));
        
        
        
//         const url = window.location.href;
//         const main_page_pattern = 'https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/(courses|options)';
//         const class_options_pattern = 'https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/courses\/.*';

//         const tables = document.getElementsByTagName('table');
//         // we still need to check for the existence of tables
//         if (url.match(main_page_pattern) && tables.length > 0) {

//             // the second table is the correct table for the main page
//             const table = tables[1];
//             [...table.children].map(async (el) => {
//                 // the sixth element displays the professor's name
//                 const profNameNode = el.firstChild.childNodes.item(6);

//                 // header row
//                 if (el.tagName === "THEAD") {
//                     const table_el = document.createElement('th');
//                     // add the css class that ScheduleBuilder uses
//                     table_el.classList.add('css-0');
//                     table_el.innerText = 'Rating';
//                     el.firstChild.insertBefore(table_el, profNameNode);
//                 }
//                 // body rows
//                 else {
//                     el.childNodes.item(2).firstChild.colSpan = 12;

//                     const profName = profNameNode.innerText;
//                     const profData = professors[profName];
//                     const table_el = document.createElement('th');
//                     table_el.classList.add('css-7aef91-cellCss');
//                     table_el.innerHTML = `<span>${profData.rating}</span>`;

//                     el.firstChild.insertBefore(table_el, profNameNode);
//                 }

//             });
//         }
//         else if (url.match(class_options_pattern) && tables.length > 0) {
//             // the first table is the correct table for the main page
//             const table = tables[0];
//             [...table.children].map(async (el) => {
//                 // the sixth element displays the professor's name
//                 const profNameNode = el.firstChild.childNodes.item(6);
//                 console.log(profNameNode);
//                 // header row
//                 if (el.tagName === "THEAD") {

//                 }
//                 // body rows
//                 else {

//                 }
//             });
//         }
        
//         // REMOVE SUBTREE MONITORING
//     }).observe(document.getElementsByTagName('html')[0], { childList: true, subtree: true });
// });






// function stringify(element) {
//     let obj = {};
//     obj.name = element.localName;
//     obj.attributes = [];
//     obj.children = [];
//     Array.from(element.attributes).forEach(a => {
//         obj.attributes.push({ name: a.name, value: a.value });
//     });
//     Array.from(element.children).forEach(c => {
//         obj.children.push(stringify(c));
//     });

//     return obj;
// }