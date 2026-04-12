chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SHOW_WARNING') {
    showWarningOverlay(msg.data);
  }
});

function showWarningOverlay(data) {
  if (document.getElementById('cybershield-warning')) return;

  const score = (data.threat_score * 100).toFixed(0);

  const overlay = document.createElement('div');
  overlay.id = 'cybershield-warning';
  overlay.innerHTML = `
    <div class="cs-warning-box">
      <div class="cs-warning-header">
        <div class="cs-warning-icon">⚠️</div>
        <div>
          <div class="cs-warning-title">CyberShield Warning</div>
          <div class="cs-warning-subtitle">This site has been flagged as potentially dangerous</div>
        </div>
      </div>
      <div class="cs-warning-score">
        <span>Threat Score: </span>
        <strong>${score}%</strong>
      </div>
      <div class="cs-warning-domain">${data.domain}</div>
      <div class="cs-warning-details">
        <div>SSL: ${data.ssl_info?.has_ssl ? '✅ Valid' : '❌ Missing'}</div>
        <div>VirusTotal: ${data.virustotal_result?.malicious_count || 0} flags</div>
      </div>
      <div class="cs-warning-actions">
        <button id="cs-go-back" class="cs-btn-safe">Go Back to Safety</button>
        <button id="cs-proceed" class="cs-btn-danger">Proceed Anyway</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('cs-go-back').addEventListener('click', () => {
    history.back();
  });

  document.getElementById('cs-proceed').addEventListener('click', () => {
    overlay.remove();
  });
}