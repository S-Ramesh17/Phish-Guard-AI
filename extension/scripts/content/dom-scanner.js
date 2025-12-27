// PhishGuard Content Script - Auto Scanner
(function() {
    console.log("PhishGuard: Auto-scanning page...");

    // Basic DOM Analysis
    const domData = {
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        protocol: window.location.protocol,
        url: window.location.href,
        domain: window.location.hostname
    };

    // --- Simulation Logic (Duplicated from popup for offline autonomy) ---
    function simulateChecks(url, domain) {
        const checks = {
            isNewDomain: domain.endsWith('.xyz') || domain.includes('test'),
            isPhishTank: ['login', 'secure', 'account'].some(kw => url.includes(kw)) && !url.includes('google.com')
        };
        return checks;
    }

    function performScan() {
        const checks = simulateChecks(domData.url, domData.domain);
        const reasons = [];
        let score = 100;

        if (domData.protocol !== 'https:') {
            score -= 30;
            reasons.push('Not using HTTPS');
        }

        if (domData.hasPasswordInput && domData.protocol !== 'https:') {
            score -= 50;
            reasons.push('Password input on insecure page');
        }

        if (checks.isNewDomain) {
            score -= 40;
            reasons.push('New domain (<30 days)');
        }

        if (checks.isPhishTank) {
            score -= 100;
            reasons.push('PhishTank Detection');
        }

        let status = 'SAFE';
        if (score < 50) status = 'PHISHING';
        else if (score < 80) status = 'SUSPICIOUS';

        const report = {
            url: domData.url,
            domain: domData.domain,
            timestamp: new Date().toISOString(),
            score: Math.max(0, score),
            status: status,
            reasons: reasons.length > 0 ? reasons : ['No threats detected']
        };

        // Save to storage
        chrome.storage.sync.get(['phishGuardReports'], (result) => {
            let reports = result.phishGuardReports || [];
            // Avoid duplicate exact timestamp/url flood
            const last = reports[0];
            if (last && last.url === report.url && (new Date() - new Date(last.timestamp) < 5000)) return;

            reports.unshift(report);
            if (reports.length > 50) reports = reports.slice(0, 50);
            
            chrome.storage.sync.set({ phishGuardReports: reports });
            console.log("PhishGuard: Auto-scan complete.", status);
        });
    }

    // Run Scan
    performScan();
})();
