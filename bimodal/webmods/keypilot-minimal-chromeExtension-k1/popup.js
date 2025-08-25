(function () {
const statusEl = document.getElementById('status');


function setStatus(mode) {
if (mode === 'delete') {
statusEl.textContent = 'DELETE';
statusEl.classList.remove('ok', 'warn');
statusEl.classList.add('err');
} else if (mode === 'text_focus') {
statusEl.textContent = 'TEXT';
statusEl.classList.remove('ok', 'err');
statusEl.classList.add('warn');
} else {
statusEl.textContent = 'ON';
statusEl.classList.remove('err', 'warn');
statusEl.classList.add('ok');
}
}


async function queryActiveTab() {
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
return tab;
}


async function getStatus() {
try {
const tab = await queryActiveTab();
if (!tab || !tab.id) return setStatus('none');
const resp = await chrome.tabs.sendMessage(tab.id, { type: 'KP_GET_STATUS' });
setStatus(resp && resp.mode || 'none');
} catch (e) {
// Content script may not be injected yet (e.g., chrome:// pages). Assume ON by default.
setStatus('none');
}
}


// Listen for push updates from the content script while the popup is open
chrome.runtime.onMessage.addListener((msg) => {
if (msg && msg.type === 'KP_STATUS') setStatus(msg.mode);
});


getStatus();
})();
