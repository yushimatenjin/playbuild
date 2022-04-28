
console.log('Installing IPCPM')
window.onmessage = _ => console.log('CONTENT SCRIPT RECIEVED MESSAGE', _)
var s = document.createElement('script');
s.src = chrome.runtime.getURL('ipcpm.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);