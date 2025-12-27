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

    // Load latest scan for active tab
    loadCurrentTabStatus();

    // Event Listeners
    UI.btnScan.addEventListener('click', manualScan);
    UI.btnExport.addEventListener('click', exportReports);
    UI.btnDashboard.addEventListener('click', openDashboard);

    async function loadCurrentTabStatus() {
        try {
            const tab = await BrowserAPI.getActiveTab();
            if (!tab || !tab.url) return;

            UI.url.textContent = new URL(tab.url).hostname;

            const reports = await BrowserAPI.getReports();
            const report = reports.find(r => r.url === tab.url);

            if (report && PhishGuardReport.validate(report)) {
                updateUI(report);
            } else {
                showUnknownStatus();
            }
        } catch (err) {
            console.error('Failed to load tab status:', err);
            showUnknownStatus();
        }
    }

    async function manualScan() {
        try {
            const tab = await BrowserAPI.getActiveTab();
            if (!tab || !tab.url) return;

            UI.btnScan.textContent = 'Scanning...';
            UI.btnScan.disabled = true;

            // Execute DOM scan on active page
            const domData = await BrowserAPI.executeScript(tab.id, scanPageDOM);

            if (domData) {
                const result = RiskScorer.calculateRisk(tab.url, domData, true);

                const report = PhishGuardReport.create(
                    tab.url,
                    result.riskScore,
                    result.riskLevel,
                    result.reasons,
                    result.breakdown,
                    domData
                );

                await BrowserAPI.addReport(report);
                updateUI(report);

                // 🔗 OPEN GITHUB-HOSTED SCAN RESULT PAGE
                const hostedScanUrl =
                    'https://s-ramesh17.github.io/Phish-Guard-AI/?url=' +
                    encodeURIComponent(tab.url) +
                    '&source=extension';

                BrowserAPI.createTab(hostedScanUrl);

                // 📄 AUTO-GENERATE PDF REPORT
                exportPDF(report);
            }
        } catch (err) {
            console.error('Scan failed:', err);
            UI.reasons.innerHTML =
                '<li>Scan failed. Refresh the page and try again.</li>';
        } finally {
            UI.btnScan.textContent = 'Scan Now';
            UI.btnScan.disabled = false;
        }
    }

    function scanPageDOM() {
        return {
            hasPasswordInput: !!document.querySelector('input[type="password"]'),
            protocol: window.location.protocol,
            title: document.title,
            inputCount: document.querySelectorAll('input').length,
            formCount: document.querySelectorAll('form').length
        };
    }

    function updateUI(report) {
        if (!PhishGuardReport.validate(report)) {
            showUnknownStatus();
            return;
        }

        UI.url.textContent = report.domain;
        UI.score.textContent = `${Math.round(report.riskScore)}`;

        const color = PhishGuardReport.getRiskColor(report.riskLevel);
        const icon = PhishGuardReport.getRiskIcon(report.riskLevel);

        UI.badge.className = `badge ${report.riskLevel.toLowerCase()}`;
        UI.badge.textContent = `${icon} ${report.riskLevel}`;
        UI.badge.style.backgroundColor = color;

        UI.reasons.innerHTML =
            report.detectionReasons.length > 0
                ? report.detectionReasons.map(r => `<li>${r}</li>`).join('')
                : '<li>No threats detected.</li>';
    }

    function showUnknownStatus() {
        UI.score.textContent = '--';
        UI.badge.className = 'badge';
        UI.badge.textContent = '? UNKNOWN';
        UI.badge.style.backgroundColor = '#6c757d';
        UI.reasons.innerHTML =
            '<li>No scan results. Click "Scan Now".</li>';
    }

    async function exportReports() {
        try {
            const reports = await BrowserAPI.getReports();
            const blob = new Blob(
                [JSON.stringify(reports, null, 2)],
                { type: 'application/json' }
            );

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download =
                `phishguard-reports-${new Date()
                    .toISOString()
                    .split('T')[0]}.json`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export reports.');
        }
    }

    function exportPDF(report) {
        if (!window.jspdf) {
            console.warn('jsPDF not loaded');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.text('PhishGuard AI – Scan Report', 10, 10);
        doc.text(`URL: ${report.url}`, 10, 25);
        doc.text(`Risk Score: ${report.riskScore}`, 10, 40);
        doc.text(`Risk Level: ${report.riskLevel}`, 10, 55);
        doc.text(
            `Scanned At: ${new Date(report.timestamp).toLocaleString()}`,
            10,
            70
        );

        doc.save('phishguard-report.pdf');
    }

    function openDashboard() {
        try {
            BrowserAPI.createTab(
                'https://s-ramesh17.github.io/Phish-Guard-AI/dashboard.html'
            );
        } catch (err) {
            console.error('Failed to open dashboard:', err);
            alert('Could not open hosted dashboard.');
        }
    }
});