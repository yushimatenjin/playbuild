
chrome.runtime.onInstalled.addListener(() => {

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

    console.log('Installed PCPM Extension')

});