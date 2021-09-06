chrome.runtime.onInstalled.addListener(async () => {
    const data = await fetch('https://ratemyprof.brianmoses.tech');
    const profs = (await data.json()).professors;

    chrome.storage.local.set( {'professors' : profs});
});

chrome.runtime.onStartup.addListener(async () => {
    const data = await fetch('https://ratemyprof.brianmoses.tech');
    const profs = (await data.json()).professors;

    chrome.storage.local.set({ 'professors': profs });
});