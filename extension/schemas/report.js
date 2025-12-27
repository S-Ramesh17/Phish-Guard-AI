/**
 * PhishGuard Unified Report Schema
 * Shared between extension and website for consistent data structure.
 * All reports follow this exact format for cross-platform compatibility.
 */

const PhishGuardReport = {
  /**
   * Report Template
   */
  template: {
    // Unique identifier for the report
    id: '',
    
    // Full URL scanned
    url: '',
    
    // Domain only (extracted from URL)
    domain: '',
    
    // Scan timestamp (ISO 8601)
    timestamp: '',
    
    // Risk score 0-100 (0=safe, 100=phishing)
    riskScore: 0,
    
    // Risk level category
    riskLevel: 'SAFE', // SAFE | SUSPICIOUS | PHISHING
    
    // Detailed reasons for risk assessment
    detectionReasons: [],
    
    // Risk breakdown by category (for detailed analysis)
    riskBreakdown: {
      domainAge: 0,        // 0-40 points
      httpsStatus: 0,      // 0-30 points
      passwordInput: 0,    // 0-50 points (penalty for password on insecure)
      phishTankMatch: 0    // 0-100 points
    },
    
    // Scan metadata
    scanMetadata: {
      hasPasswordInput: false,
      protocol: 'https',
      domainAgeDays: 0,
      isNewDomain: false,
      phishTankListed: false
    },
    
    // Source of scan
    source: 'extension' // 'extension' | 'manual'
  },

  /**
   * Create a new report instance
   */
  create: (url, riskScore, riskLevel, detectionReasons, riskBreakdown, scanMetadata) => {
    return {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: url,
      domain: new URL(url).hostname,
      timestamp: new Date().toISOString(),
      riskScore: Math.max(0, Math.min(100, riskScore)), // Clamp 0-100
      riskLevel: riskLevel,
      detectionReasons: detectionReasons || [],
      riskBreakdown: riskBreakdown || {},
      scanMetadata: scanMetadata || {},
      source: 'extension'
    };
  },

  /**
   * Validate a report object
   */
  validate: (report) => {
    if (!report || typeof report !== 'object') return false;
    if (!report.url || !report.domain || !report.timestamp) return false;
    if (typeof report.riskScore !== 'number') return false;
    if (!['SAFE', 'SUSPICIOUS', 'PHISHING'].includes(report.riskLevel)) return false;
    if (!Array.isArray(report.detectionReasons)) return false;
    return true;
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
   * Get display color for risk level
   */
  getRiskColor: (riskLevel) => {
    switch (riskLevel) {
      case 'SAFE': return '#28a745';
      case 'SUSPICIOUS': return '#ffc107';
      case 'PHISHING': return '#dc3545';
      default: return '#6c757d';
    }
  },

  /**
   * Get risk icon (as text for universal compatibility)
   */
  getRiskIcon: (riskLevel) => {
    switch (riskLevel) {
      case 'SAFE': return '✓';
      case 'SUSPICIOUS': return '⚠';
      case 'PHISHING': return '✕';
      default: return '?';
    }
  }
};

// Export for both browser and Node environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhishGuardReport;
}
