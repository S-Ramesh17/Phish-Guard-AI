# PhishGuard Demo Mode: Simulation & Testing Guide

This document explains the simulated WHOIS and PhishTank checks, and provides test scenarios for validating the system.

## 🎯 Demo Mode Philosophy

PhishGuard is designed for **academic demonstration** without relying on paid APIs. Instead of calling real WHOIS or PhishTank services, it uses **deterministic simulation logic** that clearly simulates real-world scenarios.

### Key Principle: Transparency
- All simulated checks are labeled `[DEMO MODE]` in the UI
- The logic is visible and auditable in the code
- Results are reproducible and testable
- Users know they're seeing simulation, not real data

---

## 📊 WHOIS Simulation Logic

### Real WHOIS Purpose
The WHOIS database stores domain registration information, including:
- Registration date
- Domain age
- Registrar
- Registration owner

### PhishGuard WHOIS Check
**What it does**: Determines if a domain is "new" (< 30 days old)

**Why it matters**: Phishers often use newly registered domains to avoid reputation systems

### Simulation Logic

```javascript
// In extension/utils/risk-scorer.js
checkDomainAge(domain, simulationMode = true) {
  if (simulationMode) {
    // Pattern 1: High-risk TLDs
    if (domain.endsWith('.xyz')) return 5;      // Very new
    if (domain.endsWith('.ml')) return 2;       // Extremely new
    if (domain.endsWith('.ga')) return 2;       // Extremely new
    
    // Pattern 2: Keywords indicating test/demo
    if (domain.includes('test')) return 5;      // Test domain
    
    // Default: assume established
    return 365;  // 1 year old
  }
  
  // Production: Call real WHOIS API
  return realWhoisAPI.getDomainAgeDays(domain);
}
```

### Test Scenarios

| Domain | Simulated Age | Risk Points | Result |
|--------|---------------|-------------|--------|
| `google.com` | 365 days | 0 | SAFE |
| `test-login.xyz` | 5 days | 40 | SUSPICIOUS → PHISHING |
| `verify-account.ml` | 2 days | 40 | SUSPICIOUS → PHISHING |
| `example.com` | 365 days | 0 | SAFE |
| `new-service.xyz` | 5 days | 40 | SUSPICIOUS |

### How to Test

```javascript
1. Create test domain ending in .xyz
2. Visit the domain (or navigate to URL)
3. Extension auto-scans or use "Scan Now"
4. Check score increase due to domain age
5. Verify reason: "New domain registered 5 days ago"
6. Confirm "[DEMO MODE]" label in dashboard
```

---

## 🎣 PhishTank Simulation Logic

### Real PhishTank Purpose
PhishTank is a community-driven phishing site database. It provides:
- List of known phishing URLs
- Domain reputation scores
- Real-time threat updates

### PhishGuard PhishTank Check
**What it does**: Flags domains/URLs matching known phishing patterns

**Why it matters**: Direct match against known threats is a primary detection method

### Simulation Logic

```javascript
// In extension/utils/risk-scorer.js
checkPhishTank(url, domain, simulationMode = true) {
  if (simulationMode) {
    // Pattern matching: suspicious keywords
    const phishingPatterns = [
      'login', 'signin', 'verify', 'confirm', 
      'update', 'account', 'secure', 'auth', 'password'
    ];
    
    const hasPhishingKeyword = phishingPatterns.some(
      pattern => url.toLowerCase().includes(pattern)
    );
    
    // Whitelist: major legitimate services
    const whitelistedDomains = [
      'google.com', 'facebook.com', 'apple.com', 
      'microsoft.com', 'amazon.com', 'github.com',
      'twitter.com', 'linkedin.com', 'reddit.com'
    ];
    
    const isDomainWhitelisted = whitelistedDomains.some(
      whitelisted => domain.includes(whitelisted)
    );
    
    // Verdict: keyword + non-whitelisted domain = phishing
    return hasPhishingKeyword && !isDomainWhitelisted;
  }
  
  // Production: Call real PhishTank API
  return realPhishTankAPI.isListed(url);
}
```

### Test Scenarios

| URL | Has Keyword | Whitelisted | Result |
|-----|-------------|-------------|--------|
| `https://google.com/login` | Yes | Yes | SAFE (whitelisted) |
| `https://phishing-login.com` | Yes | No | PHISHING (flagged) |
| `https://fake-account-verify.xyz` | Yes | No | PHISHING (flagged) |
| `https://example.com/about` | No | No | Safe (no keywords) |
| `https://github.com/auth` | Yes | Yes | SAFE (whitelisted) |

### How to Test

```javascript
1. Create URL with phishing keyword (login, verify, etc.)
2. Ensure it's on non-whitelisted domain
3. Visit or scan the URL
4. Verify score increases by 100 (or clamped to 100)
5. Check reason: "[DEMO MODE] Listed in PhishTank"
6. Try whitelisted domain (google.com) with same keyword
7. Verify it returns SAFE (whitelist overrides keyword match)
```

---

## 🔧 Activation & Control

### Enabling Real APIs (Future)

To switch from simulation to real APIs:

```javascript
// In extension/utils/risk-scorer.js

// CHANGE THIS:
const DEMO_MODE = true;  // ← Set to false for real APIs

calculateRisk(url, domData, simulationMode = DEMO_MODE) {
  // ... uses simulationMode flag
}
```

### Conditional Logic Pattern

```javascript
// This pattern is used throughout PhishGuard:

function check(data, simulationMode = true) {
  if (simulationMode) {
    // Deterministic simulation
    return simulatedResult;
  } else {
    // Real API call (not implemented in demo)
    return await realAPI.check(data);
  }
}
```

---

## 🧪 Complete Test Suite

### Test 1: Domain Age Scoring

**Setup**:
```
Visit: https://test-login.xyz
```

**Expected**:
```
Auto-scan completes
Risk score: 40–100 (depending on other factors)
Reason includes: "New domain registered 5 days ago"
Popup shows: ⚠ SUSPICIOUS or ✕ PHISHING
```

**Validation**:
```
✓ Domain age detection works
✓ Score penalty applied (40 points)
✓ Reason explanation provided
✓ UI properly displays result
```

---

### Test 2: HTTPS Penalty

**Setup**:
```
Create test HTML:
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><input type="password" placeholder="Password"></body>
</html>

Serve on: http://localhost:8888/test.html
Visit the page
```

**Expected**:
```
Risk score: 80/100 (30 for HTTPS + 50 for password)
Reasons:
  1. "Not using HTTPS connection"
  2. "Password input on insecure page"
Popup shows: ✕ PHISHING
```

**Validation**:
```
✓ HTTP detection works
✓ Password field detection works
✓ Score penalties stack correctly (30 + 50)
✓ Risk level correctly set to PHISHING
```

---

### Test 3: PhishTank Simulation

**Setup**:
```
Visit: https://phishing-verify-account.com
```

**Expected**:
```
Risk score: 100/100
Reasons:
  1. "[DEMO MODE] Domain listed in PhishTank database"
Popup shows: ✕ PHISHING (red)
Dashboard shows: [DEMO MODE] label
```

**Validation**:
```
✓ Keyword matching works
✓ PhishTank simulation activated
✓ Critical score applied (100 points)
✓ Demo mode label visible
```

---

### Test 4: Whitelist Bypass (Legitimate Login Pages)

**Setup**:
```
Visit: https://github.com/login
Visit: https://google.com/accounts/login
Visit: https://facebook.com/login
```

**Expected**:
```
All show: ✓ SAFE (0/100)
Reasons: "No threats detected"
No PhishTank flag despite "login" keyword
```

**Validation**:
```
✓ Whitelisted domains are protected
✓ Keywords alone don't trigger false positives
✓ Legitimate services work normally
✓ User trust in system maintained
```

---

### Test 5: Export/Import Workflow

**Setup**:
```
1. Perform 3–5 scans (mix of safe and phishing)
2. Click "Export Reports (JSON)"
3. Open dashboard
4. Click "Import Extension JSON"
5. Select the exported file
```

**Expected**:
```
Dashboard updates:
  • Stats card shows correct counts
  • Table renders all reports
  • Chart visualizes distribution
  • Badges display with correct colors
  • Score bars render to correct width
```

**Validation**:
```
✓ Export creates valid JSON
✓ Import parses JSON correctly
✓ Validation checks work
✓ DOM updates properly
✓ Data integrity maintained
```

---

### Test 6: PDF Export

**Setup**:
```
1. Import reports into dashboard
2. Click "Export to PDF"
3. Open generated PDF
```

**Expected**:
```
PDF contains:
  • Title: "PhishGuard Security Report"
  • Generated date/time
  • Table with all reports
  • Risk levels color-coded
  • Scores visible
  • Footer with page numbers
```

**Validation**:
```
✓ jsPDF library loads
✓ Table rendered in PDF
✓ Data includes all fields
✓ File downloads successfully
✓ PDF is readable
```

---

### Test 7: Cross-Browser Compatibility

**Chrome/Brave**:
```
Should use chrome.* API
BrowserAPI.getBrowser() → chrome
Extension loads and functions normally
```

**Firefox**:
```
Should use browser.* API (if adapted)
BrowserAPI.getBrowser() → browser
Extension loads and functions normally
```

**Edge**:
```
Should use chrome.* API (Chromium-based)
BrowserAPI.getBrowser() → chrome
Extension loads and functions normally
```

**Validation**:
```
✓ API wrapper correctly detects browser
✓ Appropriate API used
✓ No permission errors
✓ Storage works cross-browser
```

---

## 📋 Validation Checklist

Use this checklist to validate the entire system:

### Extension
- [ ] Manifest V3 loads without errors
- [ ] Extension icon appears in toolbar
- [ ] Popup opens without lag
- [ ] Auto-scan runs on page load
- [ ] Manual "Scan Now" button works
- [ ] Risk badges update with color
- [ ] Score displays 0–100
- [ ] Reasons list is accurate
- [ ] Export creates valid JSON
- [ ] No console errors

### Dashboard
- [ ] Page loads at localhost:5000
- [ ] Import file dialog works
- [ ] JSON validation catches bad files
- [ ] Reports render in table
- [ ] Stats cards update correctly
- [ ] Chart visualizes distribution
- [ ] Color badges display correctly
- [ ] Score bars render proportionally
- [ ] PDF export triggers download
- [ ] No console errors

### Data Integrity
- [ ] Exported JSON is well-formed
- [ ] All fields present in report
- [ ] Timestamps are ISO 8601
- [ ] Risk scores are 0–100
- [ ] Risk levels are valid enum
- [ ] Reasons array is non-empty
- [ ] No data lost in export/import

### Demo Mode
- [ ] [DEMO MODE] labels visible
- [ ] Simulation logic is deterministic
- [ ] Same URL produces same score
- [ ] Whitelist bypasses keyword flag
- [ ] Scoring is transparent and auditable
- [ ] User understands limitations

---

## 🚀 Demo Session Preparation

### Before Demo
1. [ ] Test all scenarios above
2. [ ] Prepare 3–5 test URLs
3. [ ] Clear browser history/cache
4. [ ] Load extension fresh
5. [ ] Verify JSON export format
6. [ ] Test dashboard import
7. [ ] Generate PDF sample
8. [ ] Review architecture docs
9. [ ] Practice talk track
10. [ ] Check network connectivity (jsPDF CDN)

### During Demo
1. [ ] Start with fresh extension load
2. [ ] Demonstrate auto-scan on safe site first
3. [ ] Then show phishing detection
4. [ ] Explain scoring algorithm
5. [ ] Show [DEMO MODE] labels
6. [ ] Highlight transparency
7. [ ] Export → Import → Analyze flow
8. [ ] Emphasize offline capability
9. [ ] Answer questions directly
10. [ ] Show architecture docs if asked

### Documentation to Have Ready
- [ ] README.md (overview)
- [ ] ARCHITECTURE.md (technical details)
- [ ] This file (DEMO_MODE.md)
- [ ] Source code (visible in editor)
- [ ] Sample JSON export (for reference)
- [ ] Sample PDF report (for reference)

---

**Demo Mode Status**: Active & Labeled ✓  
**Simulation Transparency**: 100% ✓  
**Test Coverage**: Comprehensive ✓  
**Ready for Academic Submission**: Yes ✓
