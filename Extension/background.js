chrome.runtime.onInstalled.addListener(async () => {
    const data = await fetch('https://ratemyprof.brianmoses.tech');
    const profs = (await data.json()).professors;

    for (const professor of Object.keys(profs)) {
        chrome.storage.local.set({ [professor] : profs[professor] })
        // map to the value, not to the key and value
    }
});

chrome.runtime.onStartup.addListener(async () => {
    const data = await fetch('https://ratemyprof.brianmoses.tech');
    const profs = (await data.json()).professors;

    for (const professor of Object.keys(profs)) {
        chrome.storage.local.set({ [professor]: profs[professor] })
    }
});