document.addEventListener('DOMContentLoaded', () => {
    const UI = {
        url: document.getElementById('current-url'),
        score: document.getElementById('security-score'),
        badge: document.getElementById('status-badge'),
        reasons: document.getElementById('reasons-list'),
        btnScan: document.getElementById('btn-scan'),
        btnExport: document.getElementById('btn-export'),
        btnDashboard: document.getElementById('btn-dashboard')
    };

    loadCurrentTabStatus();
    loadHostedScanResult();

    UI.btnScan.addEventListener('click', manualScan);
    UI.btnExport.addEventListener('click', exportReports);
    UI.btnDashboard.addEventListener('click', openDashboard);

    /* ---------------- TAB STATUS ---------------- */

    async function loadCurrentTabStatus() {
        try {
            const tab = await BrowserAPI.getActiveTab();
            if (!tab || !tab.url) return;
            UI.url.textContent = new URL(tab.url).hostname;
        } catch (err) {
            showUnknownStatus();
        }
    }

    /* ---------------- MANUAL SCAN ---------------- */

    async function manualScan() {
        try {
            const tab = await BrowserAPI.getActiveTab();
            if (!tab || !tab.url) return;

            UI.btnScan.textContent = 'Scanning...';
            UI.btnScan.disabled = true;

            // Open hosted scanner with current URL
            const hostedScanURL =
                `https://s-ramesh17.github.io/Phish-Guard-AI/?url=${encodeURIComponent(tab.url)}`;

            await BrowserAPI.createTab(hostedScanURL);

            UI.reasons.innerHTML =
                '<li>Scanning using hosted Phish-Guard-AI engine…</li>';

        } catch (err) {
            console.error('Scan failed:', err);
            UI.reasons.innerHTML =
                '<li>Scan failed. Please refresh and try again.</li>';
        } finally {
            UI.btnScan.textContent = 'Scan Now';
            UI.btnScan.disabled = false;
        }
    }

    /* ---------------- READ HOSTED RESULT ---------------- */

    function loadHostedScanResult() {
        try {
            const stored = localStorage.getItem('phishguard_latest_result');
            if (!stored) return;

            const data = JSON.parse(stored);

            const report = {
                domain: new URL(data.url).hostname,
                riskScore: data.riskScore,
                riskLevel: data.riskLevel,
                detectionReasons: data.reasons
            };

            updateUI(report);
        } catch (err) {
            console.warn('No hosted scan result available');
        }
    }

    /* ---------------- UI UPDATE ---------------- */

    function updateUI(report) {
        UI.url.textContent = report.domain;
        UI.score.textContent = Math.round(report.riskScore);

        UI.badge.className = `badge ${report.riskLevel.toLowerCase()}`;
        UI.badge.textContent = report.riskLevel.toUpperCase();
        UI.badge.style.backgroundColor = getRiskColor(report.riskLevel);

        UI.reasons.innerHTML =
            report.detectionReasons.length > 0
                ? report.detectionReasons.map(r => `<li>${r}</li>`).join('')
                : '<li>No threats detected.</li>';
    }

    function showUnknownStatus() {
        UI.score.textContent = '--';
        UI.badge.textContent = 'UNKNOWN';
        UI.badge.style.backgroundColor = '#6c757d';
        UI.reasons.innerHTML =
            '<li>No scan results. Click "Scan Now".</li>';
    }

    /* ---------------- EXPORT ---------------- */

    async function exportReports() {
        try {
            const result = localStorage.getItem('phishguard_latest_result');
            if (!result) {
                alert('No scan result available');
                return;
            }

            const blob = new Blob([result], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `phishguard-report-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Export failed');
        }
    }

    /* ---------------- DASHBOARD ---------------- */

    function openDashboard() {
        BrowserAPI.createTab(
            'https://s-ramesh17.github.io/Phish-Guard-AI/'
        );
    }

    /* ---------------- UTIL ---------------- */

    function getRiskColor(level) {
        switch (level.toLowerCase()) {
            case 'high':
                return '#dc3545';
            case 'medium':
                return '#ffc107';
            case 'low':
                return '#28a745';
            default:
                return '#6c757d';
        }
    }
});
