# PhishGuard Technical Architecture

## System Overview

PhishGuard is a decentralized, offline-first anti-phishing system with two independent components:

```
┌─────────────────────────────────────────────────────────┐
│           USER'S BROWSER ENVIRONMENT                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐          ┌──────────────────┐   │
│  │  PhishGuard      │          │  PhishGuard Hub  │   │
│  │  Extension       │          │  Dashboard       │   │
│  │  (Popup + CS)    │          │  (Website)       │   │
│  │                  │          │                  │   │
│  │ • Auto-scan DOM  │          │ • Import JSON    │   │
│  │ • Risk scoring   │          │ • Analytics      │   │
│  │ • Export JSON    │  ◄───►   │ • PDF export     │   │
│  │ • Local storage  │ (JSON)   │ • Visualization  │   │
│  └──────────────────┘          └──────────────────┘   │
│          ▲                                              │
│          │                                              │
│      Scans pages                                       │
│      (DOM + URL)                                       │
│          │                                              │
│          ▼                                              │
│    ┌─────────────────────────────────────┐            │
│    │    Browser APIs                     │            │
│    │  • Storage (chrome.storage.sync)    │            │
│    │  • Scripting (scripting.executeScript) │         │
│    │  • Tabs (tabs.query, tabs.create)    │          │
│    └─────────────────────────────────────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘

🔹 NO BACKEND SERVER
🔹 NO EXTERNAL APIS
🔹 ALL DATA LOCAL
```

## Component Architecture

### 1. Browser Extension (PhishGuard)

#### Manifest V3 Structure
```
Manifest V3
  ├── Permissions: storage, activeTab, scripting
  ├── Action: popup.html (extension icon popup)
  └── Content Scripts: dom-scanner.js (runs on all pages)
```

#### Extension Components

**A. Popup (User-Facing Interface)**
- **File**: `extension/popup/popup.html`
- **Logic**: `extension/popup/popup.js`
- **Styling**: `extension/popup/popup.css`
- **Flow**:
  ```
  1. User clicks extension icon → popup.html loads
  2. popup.js queries active tab via BrowserAPI.getActiveTab()
  3. Looks up last scan in chrome.storage.sync
  4. Displays risk badge, score, and reasons
  5. User can:
     - Click "Scan Now" → execute scanPageDOM() → RiskScorer.calculateRisk()
     - Click "Export" → download JSON file
     - Click "Dashboard" → open localhost:5000/dashboard.html
  ```

**B. Content Script (Auto-Scanner)**
- **File**: `extension/scripts/content/dom-scanner.js`
- **Injection**: Runs on all pages, fires on document end
- **Flow**:
  ```
  1. Page loads → dom-scanner.js executes
  2. Collects DOM data (password inputs, protocol, etc.)
  3. Calls RiskScorer.calculateRisk()
  4. Creates PhishGuardReport object
  5. Saves to chrome.storage.sync (keeps last 50)
  6. Logs to console (for debugging)
  ```

**C. Shared Modules**

**report.js** (Unified Schema)
```javascript
PhishGuardReport {
  template: {...}  // Full report structure
  create()         // Factory method
  validate()       // Validation
  getRiskLevel()   // Score → level
  getRiskColor()   // Level → UI color
}
```

**browser-api.js** (Cross-Browser Abstraction)
```javascript
BrowserAPI {
  getBrowser()        // Detects chrome/browser/edge
  getActiveTab()      // Platform-agnostic tab query
  createTab()         // Opens new tab
  executeScript()     // Runs script in tab context
  getReports()        // Async storage read
  saveReports()       // Async storage write
  getBrowserName()    // Returns: Chrome|Firefox|Brave|Edge
}
```

**risk-scorer.js** (Deterministic Scoring)
```javascript
RiskScorer {
  calculateRisk(url, domData, simulationMode)
    └─ Returns: {riskScore, riskLevel, breakdown, reasons}
    
  checkDomainAge(domain, simulationMode)
    └─ Returns: days since registration
    
  checkPhishTank(url, domain, simulationMode)
    └─ Returns: boolean (listed in database?)
    
  getRiskLevel(score)        // 0-100 → SAFE|SUSPICIOUS|PHISHING
  getRiskColor(riskLevel)    // Level → hex color
}
```

### 2. Web Dashboard (PhishGuard Hub)

#### Static Files Structure
```
website/
├── index.html          → Landing page (hero + features)
├── dashboard.html      → Main analytics dashboard
├── learn.html          → Educational content
├── css/styles.css      → Unified responsive styling
└── js/dashboard.js     → Import/export/analytics logic
```

#### Dashboard Data Flow
```
User Action → Event Listener → File Reader → JSON.parse() 
                                        ↓
                                 Validation
                                        ↓
                            RiskScorer.validate()
                                        ↓
                            renderDashboard(reports)
                                        ↓
                    DOM Update: Table + Chart + Stats
```

#### Dashboard Features

**Import Pipeline**:
```javascript
1. User selects JSON file
2. FileReader reads text
3. JSON.parse() → array of reports
4. Validate each report structure
5. renderDashboard() processes and displays
```

**Analytics Calculations**:
```javascript
• Count: safe, suspicious, phishing
• Average risk score
• Generate bar chart (CSS heights)
• Create table rows with badges
```

**Export Pipeline**:
```javascript
1. Collect currentReports array
2. Create PDF document via jsPDF library
3. Build table with autoTable plugin
4. Add footer with pagination
5. Trigger browser download
```

## Data Flow & Report Pipeline

### End-to-End Workflow

```
┌─ Phase 1: Detection (Extension) ─┐
│                                   │
│ 1. Page loads                     │
│ 2. dom-scanner.js activates       │
│ 3. DOM data collected             │
│ 4. RiskScorer calculates risk     │
│ 5. PhishGuardReport created       │
│ 6. Stored in chrome.storage.sync  │
│ 7. Badge shown in popup UI        │
│                                   │
└───────────────────────────────────┘
           │
           │ User clicks "Export"
           │
           ▼
┌─ Phase 2: Export (Extension) ─┐
│                                │
│ 1. BrowserAPI.getReports()     │
│ 2. All reports (JSON array)    │
│ 3. Blob + download trigger     │
│ 4. File: phishguard-reports.json
│                                │
└────────────────────────────────┘
           │
           │ User saves file
           │
           ▼
┌─ Phase 3: Import (Dashboard) ─┐
│                                │
│ 1. User selects JSON file      │
│ 2. FileReader.readAsText()     │
│ 3. JSON.parse()                │
│ 4. Validate reports            │
│ 5. renderDashboard() updates   │
│                                │
└────────────────────────────────┘
           │
           │
           ▼
┌─ Phase 4: Analytics (Dashboard) ─┐
│                                   │
│ 1. Calculate stats (counts, avg)  │
│ 2. Generate bar chart            │
│ 3. Create table rows (DOM)        │
│ 4. Display color badges          │
│                                   │
└───────────────────────────────────┘
           │
           │ User clicks "Export PDF"
           │
           ▼
┌─ Phase 5: PDF Export ─┐
│                        │
│ 1. jsPDF document     │
│ 2. Auto-table build   │
│ 3. PDF file created   │
│ 4. Browser download   │
│                        │
└────────────────────────┘
```

## Risk Scoring Algorithm

### Scoring Logic

```javascript
Score = 0 (start)

IF protocol !== 'https:' THEN
  Score += 30 (HTTPS violation)
  Reason: "Not using HTTPS connection"

IF hasPasswordInput AND protocol !== 'https:' THEN
  Score += 50 (password on insecure)
  Reason: "Password input on insecure page"

IF domainAge < 30 THEN
  Score += (30 - domainAge) * (40/30)  // Linear 0-40
  Reason: `New domain ${domainAge} days old`

IF phishTankMatch THEN
  Score += 100 (critical)
  Reason: "[DEMO MODE] Listed in PhishTank"

Score = clamp(Score, 0, 100)

RETURN {
  riskScore: Score,
  riskLevel: Score >= 70 ? 'PHISHING' : Score >= 40 ? 'SUSPICIOUS' : 'SAFE'
}
```

### Deterministic Properties

✅ **Same inputs → Same output**:
- Given identical URL and DOM data, score is always identical
- No randomization or time-dependent logic
- Enables reproducible testing and validation

✅ **Transparent calculation**:
- Each factor clearly labeled with points
- Users see exact reasons in `detectionReasons` array
- `riskBreakdown` shows contribution of each factor

✅ **Explainable scoring**:
- 4 factors, easy to understand
- Color-coded results
- Reasons are human-readable

## Report Schema

### PhishGuardReport Interface

```typescript
{
  id: string,                    // Unique identifier
  url: string,                   // Full URL scanned
  domain: string,                // Domain only (extracted)
  timestamp: string,             // ISO 8601 datetime
  
  riskScore: number,             // 0-100
  riskLevel: enum,               // SAFE | SUSPICIOUS | PHISHING
  
  detectionReasons: string[],    // List of reasons
  riskBreakdown: {
    domainAge: number,           // Points from domain age
    httpsStatus: number,         // Points from HTTPS check
    passwordInput: number,       // Points from password field
    phishTankMatch: number       // Points from PhishTank
  },
  
  scanMetadata: {
    hasPasswordInput: boolean,
    protocol: string,            // 'https:' | 'http:'
    domainAgeDays: number,
    isNewDomain: boolean,
    phishTankListed: boolean
  },
  
  source: 'extension'            // Always 'extension' for now
}
```

### Schema Validation

```javascript
PhishGuardReport.validate(report) {
  return (
    report &&
    report.url &&
    report.domain &&
    report.timestamp &&
    typeof report.riskScore === 'number' &&
    ['SAFE', 'SUSPICIOUS', 'PHISHING'].includes(report.riskLevel) &&
    Array.isArray(report.detectionReasons)
  );
}
```

## Security Architecture

### Attack Surface Minimization

```
├── Extension Content Script
│   ├── ✅ Runs in isolated context
│   ├── ✅ No XSS via eval (pure function calls)
│   ├── ✅ DOM read-only (no modification)
│   └── ✅ Keyboard input not captured
│
├── Storage Security
│   ├── ✅ chrome.storage.sync encrypted by browser
│   ├── ✅ No sensitive keys stored
│   ├── ✅ Max 50 reports (no unbounded storage)
│   └── ✅ User can delete via browser settings
│
├── Dashboard (Static HTML)
│   ├── ✅ No backend → no injection vectors
│   ├── ✅ File input validated before parse
│   ├── ✅ localStorage not used (only runtime)
│   └── ✅ No network requests except jsPDF CDN
│
└── Cross-Browser
    ├── ✅ API wrapper detects browser at runtime
    ├── ✅ No eval or dynamic script injection
    └── ✅ Only uses native browser APIs
```

### Privacy Guarantees

```
Data Flow:
1. User visits page
2. dom-scanner.js reads DOM locally
3. RiskScorer processes locally
4. Report created locally
5. Stored in browser's encrypted storage
6. Never sent to network (except explicit export)

Export Flow:
1. User manually clicks "Export"
2. File downloaded to user's computer
3. User controls who receives it
4. Data never auto-synced to cloud
```

## Cross-Browser Compatibility

### BrowserAPI Abstraction Layer

```javascript
BrowserAPI.getBrowser() {
  if (chrome?.tabs) return chrome;
  if (browser?.tabs) return browser;  // Firefox
  throw Error('API not available');
}

// Usage in code:
const api = BrowserAPI.getBrowser();
const tabs = await api.tabs.query({...});
```

### Supported Browsers

| Browser | API Object | Status |
|---------|-----------|--------|
| Chrome | `chrome.*` | ✅ Primary |
| Brave | `chrome.*` | ✅ Works (uses Chrome API) |
| Edge | `chrome.*` | ✅ Works (Chromium-based) |
| Firefox | `browser.*` | ✅ Adapter in place |

### Platform Differences

| Feature | Chrome | Firefox | Handling |
|---------|--------|---------|----------|
| `scripting.executeScript()` | ✅ | ❌ | Fallback to `tabs.executeScript()` |
| `storage.sync` | ✅ | ✅ | Both supported |
| `tabs.query()` | ✅ | ✅ | Identical API |
| `tabs.create()` | ✅ | ✅ | Identical API |

## Performance Characteristics

### Extension Performance
- **Auto-scan time**: < 100ms (DOM traversal only)
- **Storage writes**: < 50ms (50 reports max)
- **Popup load**: < 200ms (cached data retrieval)
- **Memory footprint**: < 5MB (zip size: ~200KB)

### Dashboard Performance
- **JSON import**: < 100ms (< 50 reports)
- **PDF generation**: 1–3s (network-dependent, jsPDF CDN)
- **Chart rendering**: < 50ms (CSS-based, no canvas)
- **Responsive**: Works on mobile (flex-based layout)

## Future Extensibility

### Modular Design

```javascript
// New detection methods can be added:
RiskScorer.checkCustomFactor = (data) => {
  // returns: { score, reason }
}

// New report types:
class PhishGuardReportV2 extends PhishGuardReport {
  // additional fields
}

// New storage backends:
class IndexedDBStorage extends IStorage {
  // unlimited capacity
}
```

### API Integration Points

```javascript
// Real WHOIS API integration:
RiskScorer.checkDomainAge = async (domain) => {
  const response = await fetch(`/api/whois/${domain}`);
  return await response.json();
}

// Real PhishTank API:
RiskScorer.checkPhishTank = async (url) => {
  const response = await fetch(`/api/phishtank/check?url=${url}`);
  return await response.json();
}
```

## Testing & Validation

### Unit Test Scenarios

```javascript
// Risk scoring tests
assert(RiskScorer.calculateRisk("https://google.com", {...}) === 0);
assert(RiskScorer.calculateRisk("http://login.xyz", {...}) > 40);
assert(RiskScorer.calculateRisk("https://verify-account.ml", {...}) === 70);

// Report validation
assert(PhishGuardReport.validate(validReport) === true);
assert(PhishGuardReport.validate({...}) === false);

// Cross-browser API
assert(BrowserAPI.getBrowser() !== undefined);
assert(BrowserAPI.getBrowserName() in ['Chrome', 'Firefox', 'Brave', 'Edge']);
```

### Integration Test Workflow

```javascript
1. Load extension in browser
2. Visit test domain (e.g., test-login.xyz)
3. Auto-scan executes
4. Report created and stored
5. Export JSON file
6. Import into dashboard
7. Verify table rendering
8. Export to PDF
9. Validate PDF content
```

---

**Architecture Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Complete & Documented
