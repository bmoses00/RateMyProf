chrome.runtime.onInstalled.addListener(async () => {
    const data = await fetch('https://ratemyprof.brianmoses.tech');
    const profs = await data.json();
    chrome.storage.local.set({ 'professors': profs });
    // await chrome.storage.local.get(['professors'], res => {
    //     console.log(res);
    // });
});