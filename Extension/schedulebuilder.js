new MutationObserver((mutations, observer) => {
    /* the reason we use REGEX matching inside the observer instead in manifest.json
    script is that matching subdirectories in manifest.json is inconsistent*/
    const url = window.location.href;
    const main_page_pattern = 'https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/options'
    const class_options_pattern = 'https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/courses\/.*'
    if (url.match(main_page_pattern)) {
        console.log('On main page');
    }
    else if (url.match(class_options_pattern)) {
        console.log('On options page');
    }
    // const tables = document.getElementsByTagName('table');
    /* this detects whether there are tables with professor names. On all the pages 
    with tables that have professors' names, the first table element has 0 classes. */
    // if (tables.length > 0 && tables[0].classList.length == 0) {
        /* there are two pages with professors that have tables. 


        */
    // console.log(   document.getElementsByTagName('table')[0].classList.length);
    // const table = document.getElementsByTagName('table')[1];
    // [...table.children].map((el) => {
    //     const profName = el.firstChild.childNodes.item(6).innerText;
    //     chrome.storage.local.get( [profName], profData => {
    //         console.log(profData);
    //     })
    // });
    
    // observer.disconnect();
}).observe(document.getElementById('scheduler-app')/*sByClassName('.css-ojbn2n-contentCss-App')*/, { subtree: true, childList: true });

// REGEX: https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/options
// REGEX: https:\/\/stonybrook.collegescheduler.com\/terms\/.*\/courses\/.*