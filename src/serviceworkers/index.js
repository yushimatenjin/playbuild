
const syncBadge = async projectId => {

    
    const setBadge = on => {
        const suffix = on ? '' : '-gs'
        chrome.action.setIcon({ 
            path: {
                "16": `icon-16${suffix}.png`,
                "48": `icon-48${suffix}.png`,
                "128": `icon-128${suffix}.png`
            }
        })
    }

    const toggleBadge = async _ => {

        const storage = await chrome.storage.sync.get([projectId])
        const storageExists = Object.keys(storage).length > 0


        if(storageExists){
            await chrome.storage.sync.remove([projectId])
            setBadge(false)
        } else {
            await chrome.storage.sync.set({ [projectId]: true })
            setBadge(true)
        }

        // update the content scripts
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {message: "pcpm:enabled", data: !storageExists })
        })
    }

    
    // When badge is clicked, toggle it's display
    chrome.action.onClicked.addListener(toggleBadge)

    const storage = await chrome.storage.sync.get([projectId])
    const storageExists = Object.keys(storage).length > 0
    setBadge(storageExists)
}

chrome.runtime.onInstalled.addListener(() => {

    chrome.runtime.onMessage.addListener(({ message, data }) => {
        if (message === "pcpm:editor-loaded") {
            syncBadge(data.id.toString())
        } else if (message === "pcpm:build"){
            chrome.action.setBadgeText({ detail: 'building'})
        } else if (message === "pcpm:build"){
            
        }
    })

    if(DEBUG) {

        /*
            Dev util to handle hot reloading of chrome extension
        */
        websocket = new WebSocket("ws://localhost:8080");
        websocket.onmessage = async function(e) {
            if(e.data === 'rebuild') {
                let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                await chrome.tabs.reload(tab.id);
                await chrome.runtime.reload()
            }
        }    
    }

    console.log('Installed PCPM Extension')

});