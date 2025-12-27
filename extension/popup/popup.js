document.addEventListener('DOMContentLoaded', () => {
    // --- Mock Utils for Popup Context ---
    // (In a real extension with modules, these would be imported from utils/)
    const Utils = {
        simulateWhois: (domain) => {
            // Simulate: domains ending in .xyz or containing 'test' are "new"
            const isNew = domain.endsWith('.xyz') || domain.includes('test');
            return isNew ? { ageDays: 5, created: new Date().toISOString() } : { ageDays: 365, created: '2020-01-01' };
        },
        simulatePhishTank: (url) => {
            // Simulate: urls containing 'login' or 'secure' or 'account' on non-standard domains are flagged
            const suspiciousKeywords = ['login', 'secure', 'account', 'update', 'verify'];
            const isPhishing = suspiciousKeywords.some(kw => url.includes(kw)) && !url.includes('google.com') && !url.includes('facebook.com');
            return isPhishing;
        }
    };

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
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) return;

        UI.url.textContent = new URL(tab.url).hostname;
        
        // Check storage for existing report
        chrome.storage.sync.get(['phishGuardReports'], (result) => {
            const reports = result.phishGuardReports || [];
            const report = reports.find(r => r.url === tab.url); // Simple match
            if (report) {
                updateUI(report);
            } else {
                UI.score.textContent = '--';
                UI.badge.className = 'badge';
                UI.badge.textContent = 'UNKNOWN';
                UI.badge.style.backgroundColor = '#6c757d';
                UI.reasons.innerHTML = '<li>No recent scan. Click "Scan Now".</li>';
            }
        });
    }

    async function manualScan() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        UI.btnScan.textContent = 'Scanning...';
        
        // Execute script in tab to get DOM info
        try {
            const [results] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: scanPageDOM
            });
            
            const domData = results.result;
            const report = analyze(tab.url, domData);
            
            saveReport(report);
            updateUI(report);
        } catch (e) {
            console.error('Scan failed:', e);
            UI.reasons.innerHTML = '<li>Scan failed. Refresh page.</li>';
        } finally {
            UI.btnScan.textContent = 'Scan Now';
        }
    }

    // Function injected into page
    function scanPageDOM() {
        return {
            hasPasswordInput: !!document.querySelector('input[type="password"]'),
            protocol: window.location.protocol,
            title: document.title,
            inputCount: document.querySelectorAll('input').length
        };
    }

    function analyze(url, domData) {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const reasons = [];
        let score = 100;

        // 1. SSL Check
        if (domData.protocol !== 'https:') {
            score -= 30;
            reasons.push('Not using HTTPS connection');
        }

        // 2. Password Input on Insecure or Suspicious Page
        if (domData.hasPasswordInput && domData.protocol !== 'https:') {
            score -= 50;
            reasons.push('Password input detected on insecure page');
        }

        // 3. Simulated WHOIS (< 30 days)
        const whois = Utils.simulateWhois(domain);
        if (whois.ageDays < 30) {
            score -= 40;
            reasons.push(`New domain registered ${whois.ageDays} days ago`);
        }

        // 4. Simulated PhishTank
        if (Utils.simulatePhishTank(url)) {
            score -= 100; // Critical
            reasons.push('Listed in PhishTank database (Simulated)');
        }

        // Determine Status
        let status = 'SAFE';
        if (score < 50) status = 'PHISHING';
        else if (score < 80) status = 'SUSPICIOUS';

        return {
            url: url,
            domain: domain,
            timestamp: new Date().toISOString(),
            score: Math.max(0, score),
            status: status,
            reasons: reasons.length > 0 ? reasons : ['No threats detected']
        };
    }

    function saveReport(report) {
        chrome.storage.sync.get(['phishGuardReports'], (result) => {
            let reports = result.phishGuardReports || [];
            // Add new, keep last 50
            reports.unshift(report);
            if (reports.length > 50) reports = reports.slice(0, 50);
            
            chrome.storage.sync.set({ phishGuardReports: reports });
        });
    }

    function updateUI(report) {
        UI.url.textContent = report.domain;
        UI.score.textContent = report.score;
        
        // Update Badge
        UI.badge.className = `badge ${report.status.toLowerCase()}`;
        UI.badge.textContent = report.status;

        // Update Reasons
        UI.reasons.innerHTML = report.reasons
            .map(r => `<li>${r}</li>`)
            .join('');
    }

    function exportReports() {
        chrome.storage.sync.get(['phishGuardReports'], (result) => {
            const reports = result.phishGuardReports || [];
            const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'phishguard-reports.json';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    function openDashboard() {
        // Open the Hub website (Assuming hosted on localhost:5000 or the Replit URL)
        // For the academic demo, we'll open a hardcoded URL or file
        // Since this runs in extension, we can open the local dashboard.html or the hosted one.
        // Let's assume the user will open the hosted version.
        // For now, we'll open the "website/index.html" if we knew the URL.
        // We'll prompt the user or just link to the known replit url placeholder.
        
        // Actually, let's open a new tab pointing to the Replit dev URL
        // Since I don't know the dynamic replit url inside the extension code easily without hardcoding,
        // I will just put a placeholder alert or try to open localhost:5000 for the demo environment.
        chrome.tabs.create({ url: 'http://localhost:5000/dashboard.html' });
    }
});
