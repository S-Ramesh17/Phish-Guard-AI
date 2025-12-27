// PhishGuard Content Script - Auto Scanner
(function() {
    console.log('PhishGuard: Auto-scanning page...');

    const domData = {
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        protocol: window.location.protocol,
        url: window.location.href,
        domain: window.location.hostname,
        title: document.title,
        inputCount: document.querySelectorAll('input').length,
        formCount: document.querySelectorAll('form').length
    };

    function performScan() {
        try {
            // Calculate risk using unified scoring engine
            const result = {
                domainAge: checkDomainAge(domData.domain, true),
                isPhishTank: checkPhishTank(domData.url, domData.domain, true),
                hasPasswordInput: domData.hasPasswordInput,
                protocol: domData.protocol
            };

            const breakdown = {
                domainAge: 0,
                httpsStatus: 0,
                passwordInput: 0,
                phishTankMatch: 0
            };
            const reasons = [];
            let score = 0;

            // HTTPS Check
            if (domData.protocol !== 'https:') {
                breakdown.httpsStatus = 30;
                score += 30;
                reasons.push('Not using HTTPS connection');
            }

            // Password on insecure
            if (domData.hasPasswordInput && domData.protocol !== 'https:') {
                breakdown.passwordInput = 50;
                score += 50;
                reasons.push('Password input detected on insecure connection');
            }

            // Domain age
            if (result.domainAge < 30) {
                breakdown.domainAge = Math.round((30 - result.domainAge) * (40 / 30));
                score += breakdown.domainAge;
                reasons.push(`New domain registered ${result.domainAge} days ago`);
            }

            // PhishTank
            if (result.isPhishTank) {
                breakdown.phishTankMatch = 100;
                score += 100;
                reasons.push('[DEMO MODE] Domain listed in PhishTank database');
            }

            score = Math.max(0, Math.min(100, score));

            // Determine level
            let status = 'SAFE';
            if (score >= 70) status = 'PHISHING';
            else if (score >= 40) status = 'SUSPICIOUS';

            const report = {
                id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                url: domData.url,
                domain: domData.domain,
                timestamp: new Date().toISOString(),
                riskScore: score,
                riskLevel: status,
                detectionReasons: reasons.length > 0 ? reasons : ['No threats detected'],
                riskBreakdown: breakdown,
                scanMetadata: {
                    hasPasswordInput: domData.hasPasswordInput,
                    protocol: domData.protocol,
                    domainAgeDays: result.domainAge,
                    isNewDomain: result.domainAge < 30,
                    phishTankListed: result.isPhishTank
                },
                source: 'extension'
            };

            // Save to storage
            chrome.storage.sync.get(['phishGuardReports'], (result) => {
                let reports = result.phishGuardReports || [];
                const last = reports[0];
                
                // Avoid duplicate floods
                if (last && last.url === report.url && (Date.now() - new Date(last.timestamp).getTime()) < 5000) {
                    console.log('PhishGuard: Duplicate scan suppressed.');
                    return;
                }

                reports.unshift(report);
                if (reports.length > 50) reports = reports.slice(0, 50);
                
                chrome.storage.sync.set({ phishGuardReports: reports });
                console.log(`PhishGuard: Scan complete. Risk: ${report.riskLevel} (${report.riskScore}/100)`);
            });

        } catch (err) {
            console.error('PhishGuard: Scan error -', err);
        }
    }

    // Simulation functions (duplicated here for offline autonomy)
    function checkDomainAge(domain, simulationMode = true) {
        if (simulationMode) {
            if (domain.endsWith('.xyz') || domain.includes('test')) return 5;
            if (domain.endsWith('.ml') || domain.endsWith('.ga')) return 2;
            return 365;
        }
        return 365;
    }

    function checkPhishTank(url, domain, simulationMode = true) {
        if (simulationMode) {
            const patterns = ['login', 'signin', 'verify', 'confirm', 'update', 'account', 'secure', 'auth', 'password'];
            const isPhishing = patterns.some(p => url.toLowerCase().includes(p));
            const whitelist = ['google.com', 'facebook.com', 'apple.com', 'microsoft.com', 'amazon.com', 'github.com'];
            const isWhitelisted = whitelist.some(w => domain.includes(w));
            return isPhishing && !isWhitelisted;
        }
        return false;
    }

    // Run scan on page load
    performScan();
})();
