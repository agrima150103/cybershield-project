const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  document.getElementById('login-btn').addEventListener('click', login);
  document.getElementById('scan-btn').addEventListener('click', () => {
    const url = document.getElementById('scan-url').value;
    if (url) scanUrl(url);
  });
  document.getElementById('scan-current').addEventListener('click', scanCurrentPage);
  document.getElementById('logout-btn').addEventListener('click', logout);
});

async function checkAuth() {
  chrome.runtime.sendMessage({ type: 'GET_TOKEN' }, (res) => {
    if (res && res.token) {
      showMain();
    } else {
      showLogin();
    }
  });
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.token) {
      chrome.runtime.sendMessage({ type: 'SET_TOKEN', token: data.token });
      showMain();
    } else {
      errorEl.textContent = data.error || 'Login failed';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = 'Cannot connect to server';
    errorEl.style.display = 'block';
  }
}

function showLogin() {
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('main-section').classList.add('hidden');
}

function showMain() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('main-section').classList.remove('hidden');
}

function logout() {
  chrome.storage.local.remove('token');
  chrome.runtime.sendMessage({ type: 'SET_TOKEN', token: null });
  showLogin();
}

async function scanCurrentPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      document.getElementById('scan-url').value = tabs[0].url;
      scanUrl(tabs[0].url);
    }
  });
}

async function scanUrl(url) {
  document.getElementById('result-container').classList.remove('hidden');
  document.getElementById('result-domain').textContent = 'Scanning...';
  document.getElementById('result-score').textContent = '';

  chrome.runtime.sendMessage({ type: 'SCAN_URL', url }, (result) => {
    if (result && result.error) {
      document.getElementById('result-domain').textContent = 'Error: ' + result.error;
      return;
    }
    displayResult(result);
  });
}

function displayResult(r) {
  const scorePercent = (r.threat_score * 100).toFixed(0);
  const color = r.threat_score > 0.6 ? '#f87171' : r.threat_score > 0.3 ? '#fbbf24' : '#34d399';
  const label = r.threat_score > 0.6 ? 'High Risk' : r.threat_score > 0.3 ? 'Suspicious' : 'Safe';

  document.getElementById('result-domain').textContent = r.domain;
  document.getElementById('result-score').textContent = scorePercent + '%';
  document.getElementById('result-score').style.color = color;

  const labelEl = document.getElementById('result-label');
  labelEl.textContent = label;
  labelEl.style.background = color + '18';
  labelEl.style.color = color;

  const barFill = document.getElementById('result-bar-fill');
  barFill.style.width = scorePercent + '%';
  barFill.style.background = `linear-gradient(90deg, #34d399, ${color})`;

  document.getElementById('detail-ssl').textContent = r.ssl_info?.has_ssl ? 'Valid' : 'Missing';
  document.getElementById('detail-ssl').style.color = r.ssl_info?.has_ssl ? '#34d399' : '#f87171';

  document.getElementById('detail-ip').textContent = r.features?.has_ip_address ? 'Yes' : 'No';
  document.getElementById('detail-ip').style.color = r.features?.has_ip_address ? '#f87171' : '#34d399';

  document.getElementById('detail-age').textContent = r.whois_data?.domain_age_days ? r.whois_data.domain_age_days + 'd' : 'N/A';
  document.getElementById('detail-age').style.color = '#f0f4f8';

  const vtCount = r.virustotal_result?.malicious_count || 0;
  document.getElementById('detail-vt').textContent = vtCount + ' flags';
  document.getElementById('detail-vt').style.color = vtCount > 0 ? '#f87171' : '#34d399';
}