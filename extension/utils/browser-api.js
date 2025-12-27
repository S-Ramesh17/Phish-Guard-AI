/**
 * Cross-Browser API Wrapper
 * Abstracts chrome.*/ browser.*/ edge.* APIs for universal compatibility.
 * Supports: Chrome, Brave, Edge, Firefox (with minor adapters)
 */

const BrowserAPI = {
  /**
   * Get the appropriate browser API object
   */
  getBrowser: () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      return chrome;
    } else if (typeof browser !== 'undefined' && browser.tabs) {
      return browser;
    }
    throw new Error('Browser extension API not available');
  },

  /**
   * Query active tab
   */
  getActiveTab: async () => {
    const api = BrowserAPI.getBrowser();
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  },

  /**
   * Create new tab
   */
  createTab: async (url) => {
    const api = BrowserAPI.getBrowser();
    return await api.tabs.create({ url });
  },

  /**
   * Execute script in tab
   */
  executeScript: async (tabId, func) => {
    const api = BrowserAPI.getBrowser();
    
    // Chrome/Brave/Edge use scripting.executeScript
    if (api.scripting && api.scripting.executeScript) {
      const results = await api.scripting.executeScript({
        target: { tabId: tabId },
        function: func
      });
      return results[0]?.result;
    }
    
    // Firefox uses tabs.executeScript (deprecated but fallback)
    if (api.tabs && api.tabs.executeScript) {
      const results = await api.tabs.executeScript(tabId, {
        code: `(${func.toString()})()`
      });
      return results[0];
    }
    
    throw new Error('executeScript not available');
  },

  /**
   * Get storage key
   */
  storageKey: 'phishGuardReports',

  /**
   * Get all reports from storage
   */
  getReports: async () => {
    const api = BrowserAPI.getBrowser();
    return new Promise((resolve) => {
      api.storage.sync.get([BrowserAPI.storageKey], (result) => {
        resolve(result[BrowserAPI.storageKey] || []);
      });
    });
  },

  /**
   * Save reports to storage
   */
  saveReports: async (reports) => {
    const api = BrowserAPI.getBrowser();
    return new Promise((resolve) => {
      const obj = {};
      obj[BrowserAPI.storageKey] = reports;
      api.storage.sync.set(obj, () => {
        resolve();
      });
    });
  },

  /**
   * Add a single report
   */
  addReport: async (report) => {
    const reports = await BrowserAPI.getReports();
    reports.unshift(report);
    
    // Keep last 50
    if (reports.length > 50) {
      reports.length = 50;
    }
    
    await BrowserAPI.saveReports(reports);
    return report;
  },

  /**
   * Get browser name for detection
   */
  getBrowserName: () => {
    const ua = navigator.userAgent;
    if (ua.indexOf('Brave') > -1) return 'Brave';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    return 'Unknown';
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserAPI;
}
