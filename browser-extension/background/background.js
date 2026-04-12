const API_BASE = 'http://localhost:5000/api';
let authToken = null;

// Listen for token from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SET_TOKEN') {
    authToken = msg.token;
    chrome.storage.local.set({ token: msg.token });
    sendResponse({ success: true });
  }

  if (msg.type === 'GET_TOKEN') {
    chrome.storage.local.get('token', (data) => {
      sendResponse({ token: data.token || null });
    });
    return true;
  }

  if (msg.type === 'SCAN_URL') {
    scanUrl(msg.url).then(sendResponse);
    return true;
  }
});

// Load token on startup
chrome.storage.local.get('token', (data) => {
  if (data.token) authToken = data.token;
});

async function scanUrl(url) {
  if (!authToken) return { error: 'Not logged in' };

  try {
    const response = await fetch(`${API_BASE}/scan/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) return { error: 'Scan failed' };
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
}

// Check URLs on navigation
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (!authToken) return;

  const url = details.url;
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) return;

  try {
    const result = await scanUrl(url);
    if (result && result.threat_score > 0.6) {
      chrome.tabs.sendMessage(details.tabId, {
        type: 'SHOW_WARNING',
        data: result,
      }).catch(() => {});
    }
  } catch {}
});