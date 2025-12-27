/**
 * PhishGuard Risk Scoring Engine
 * Deterministic 0-100 risk calculation based on multiple factors.
 * Same inputs always produce same output for reproducibility.
 */

const RiskScorer = {
  /**
   * Main scoring function
   * Returns: { riskScore, riskLevel, breakdown, reasons }
   */
  calculateRisk: (url, domData, simulationMode = true) => {
    const breakdown = {
      domainAge: 0,
      httpsStatus: 0,
      passwordInput: 0,
      phishTankMatch: 0
    };
    const reasons = [];
    let score = 0;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const protocol = urlObj.protocol;

      // ===== FACTOR 1: HTTPS Check (0-30 points) =====
      if (protocol !== 'https:') {
        breakdown.httpsStatus = 30;
        score += 30;
        reasons.push('Not using HTTPS connection');
      }

      // ===== FACTOR 2: Password Input on Insecure Connection (0-50 points) =====
      if (domData.hasPasswordInput && protocol !== 'https:') {
        breakdown.passwordInput = 50;
        score += 50;
        reasons.push('Password input detected on insecure connection');
      }

      // ===== FACTOR 3: Domain Age (0-40 points) =====
      const domainAge = RiskScorer.checkDomainAge(domain, simulationMode);
      if (domainAge < 30) {
        // Linear penalty: new domain = 40 points, 30 days = 0 points
        breakdown.domainAge = Math.round((30 - domainAge) * (40 / 30));
        score += breakdown.domainAge;
        reasons.push(`New domain registered ${domainAge} days ago`);
      }

      // ===== FACTOR 4: PhishTank Check (0-100 points) =====
      const isPhishTank = RiskScorer.checkPhishTank(url, domain, simulationMode);
      if (isPhishTank) {
        breakdown.phishTankMatch = 100;
        score += 100;
        reasons.push(
          simulationMode 
            ? '[DEMO MODE] Domain listed in PhishTank database' 
            : 'Domain listed in PhishTank database'
        );
      }

      // Clamp to 0-100
      score = Math.max(0, Math.min(100, score));

    } catch (err) {
      console.error('Risk scoring error:', err);
      reasons.push('Error during risk assessment');
      score = 50; // Default to suspicious on error
    }

    const riskLevel = RiskScorer.getRiskLevel(score);

    return {
      riskScore: score,
      riskLevel: riskLevel,
      breakdown: breakdown,
      reasons: reasons,
      scored: true
    };
  },

  /**
   * Check domain registration age (simulated)
   * In production, this would call real WHOIS API
   */
  checkDomainAge: (domain, simulationMode = true) => {
    if (simulationMode) {
      // DEMO: Domains with .xyz or 'test' are treated as new
      if (domain.endsWith('.xyz') || domain.includes('test')) {
        return 5; // 5 days old
      }
      if (domain.endsWith('.ml') || domain.endsWith('.ga')) {
        return 2; // Suspicious TLDs - very new
      }
      // Default: assume established domain
      return 365;
    }

    // Real WHOIS lookup would go here
    return 365;
  },

  /**
   * Check PhishTank listing (simulated)
   * In production, this would call real PhishTank API
   */
  checkPhishTank: (url, domain, simulationMode = true) => {
    if (simulationMode) {
      // DEMO: Known phishing patterns
      const phishingPatterns = [
        'login', 'signin', 'verify', 'confirm', 'update', 
        'account', 'secure', 'auth', 'password'
      ];

      // Check for suspicious patterns
      const isPhishing = phishingPatterns.some(pattern => 
        url.toLowerCase().includes(pattern)
      );

      // Whitelist major legitimate services
      const whitelistedDomains = [
        'google.com', 'facebook.com', 'apple.com', 'microsoft.com',
        'amazon.com', 'github.com', 'twitter.com', 'linkedin.com',
        'reddit.com', 'youtube.com', 'instagram.com', 'wikipedia.org'
      ];

      const isDomainWhitelisted = whitelistedDomains.some(whitelisted => 
        domain.includes(whitelisted)
      );

      return isPhishing && !isDomainWhitelisted;
    }

    // Real PhishTank lookup would go here
    return false;
  },

  /**
   * Determine risk level from score
   */
  getRiskLevel: (score) => {
    if (score >= 70) return 'PHISHING';
    if (score >= 40) return 'SUSPICIOUS';
    return 'SAFE';
  },

  /**
   * Get risk color for UI
   */
  getRiskColor: (riskLevel) => {
    const colors = {
      'SAFE': '#28a745',
      'SUSPICIOUS': '#ffc107',
      'PHISHING': '#dc3545',
      'UNKNOWN': '#6c757d'
    };
    return colors[riskLevel] || colors['UNKNOWN'];
  },

  /**
   * Format score for display
   */
  formatScore: (score) => {
    return `${Math.round(score)}/100`;
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RiskScorer;
}
