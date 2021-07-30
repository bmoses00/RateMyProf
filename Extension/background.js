chrome.runtime.onInstalled.addListener(async () => {
    console.log('Installed');
    const data = await fetch('https://ratemyprof.brianmoses.tech');
    const profs = await data.json();
    chrome.storage.local.set({ 'professors': profs });
});

chrome.runtime.onStartup.addListener(async () => {
    console.log('Chrome startup');
    const data = await fetch('https://ratemyprof.brianmoses.tech');
    const profs = await data.json();
    chrome.storage.local.set({ 'professors': profs });
});