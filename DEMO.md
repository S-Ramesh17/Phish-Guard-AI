# PhishGuard: Step-by-Step Demo Guide

This guide walks you through a complete demonstration of PhishGuard for academic evaluation.

## 📋 Prerequisites

- Chrome, Brave, Edge, or Firefox browser
- Downloaded PhishGuard project (unzipped)
- Node.js 20+ (optional, for running the dashboard server)

## 🎬 Demo Scenario (5–10 minutes)

### Part 1: Extension Installation & Auto-Scan (2 min)

**Goal**: Show that the extension auto-scans pages without manual configuration.

**Steps**:

1. **Load Extension**
   ```
   1. Open browser → chrome://extensions/ (or about:debugging#/runtime/this-firefox)
   2. Enable "Developer Mode" (top-right toggle)
   3. Click "Load Unpacked"
   4. Select the `extension/` folder from PhishGuard
   5. Extension icon appears in toolbar
   ```

2. **Test Auto-Scan on Safe Site**
   ```
   1. Visit: https://www.google.com
   2. Wait 2 seconds (dom-scanner.js auto-runs)
   3. Click PhishGuard icon
   4. Show: Green "✓ SAFE" badge, score 0/100
   5. Reason: "No threats detected"
   ```

3. **Test Auto-Scan on Suspicious Site**
   ```
   1. Visit: https://test-login.xyz (or use a local test page)
   2. Wait 2 seconds
   3. Click PhishGuard icon
   4. Show: Yellow "⚠ SUSPICIOUS" or Red "✕ PHISHING" badge
   5. Score: 40–100 depending on factors
   6. Reasons: 
      - "New domain registered 5 days ago" (simulated)
      - "[DEMO MODE] Domain listed in PhishTank" (simulated)
   ```

**Key Points to Highlight**:
- ✅ No setup required after loading extension
- ✅ Automatic scanning on every page
- ✅ Real-time badge updates
- ✅ Clear explanation of risk factors

---

### Part 2: Risk Scoring Transparency (2 min)

**Goal**: Demonstrate the deterministic, explainable risk scoring.

**Steps**:

1. **Manual Scan on HTTP Page**
   ```
   1. Create test HTML file (or use: http://example.com)
   2. Include <input type="password"> tag
   3. Visit the page
   4. Click PhishGuard → "Scan Now"
   5. Show calculated score breakdown:
      - "Not using HTTPS connection" (-30 points)
      - "Password input on insecure page" (-50 points)
      - Total: 80/100 = PHISHING
   ```

2. **Compare Multiple Scans**
   ```
   Scan 1: https://github.com
      Result: SAFE (0/100)
      Reason: HTTPS + whitelisted domain
   
   Scan 2: https://login-verify.xyz
      Result: PHISHING (100/100)
      Reasons:
        - "New domain registered 5 days ago" (-40)
        - "[DEMO MODE] Listed in PhishTank" (-100, clamped)
        - Total: 100
   
   Scan 3: https://account-update-secure.com (HTTP)
      Result: SUSPICIOUS (40-60/100)
      Reasons:
        - "Not using HTTPS" (-30)
        - Keywords present (login, account, update)
   ```

**Key Points to Highlight**:
- ✅ **Deterministic**: Same URL always gets same score
- ✅ **Transparent**: Each reason listed with point value
- ✅ **Explainable**: Users understand why a site is flagged
- ✅ **Demo labels**: Clear "(DEMO MODE)" indicators for simulated checks

---

### Part 3: Export & Import Pipeline (2 min)

**Goal**: Show the manual JSON import/export workflow.

**Steps**:

1. **Export from Extension**
   ```
   1. Click PhishGuard icon
   2. Click "Export Reports (JSON)"
   3. File downloads: phishguard-reports-2024-12-27.json
   4. Show file size: ~2–5 KB for 5–10 reports
   5. Open file in text editor to show JSON structure
   ```

2. **Inspect JSON Structure**
   ```json
   [
     {
       "id": "report_1234567890_abc123",
       "url": "https://test-login.xyz",
       "domain": "test-login.xyz",
       "timestamp": "2024-12-27T15:30:00.000Z",
       "riskScore": 100,
       "riskLevel": "PHISHING",
       "detectionReasons": [
         "New domain registered 5 days ago",
         "[DEMO MODE] Domain listed in PhishTank database"
       ],
       "riskBreakdown": {
         "domainAge": 40,
         "httpsStatus": 0,
         "passwordInput": 0,
         "phishTankMatch": 60
       },
       "scanMetadata": {
         "hasPasswordInput": false,
         "protocol": "https:",
         "domainAgeDays": 5,
         "isNewDomain": true,
         "phishTankListed": true
       },
       "source": "extension"
     }
   ]
   ```

3. **Import into Dashboard**
   ```
   1. Open dashboard (if server running):
      http://localhost:5000/dashboard.html
   
   2. Click "Import Extension JSON"
   3. Select the exported phishguard-reports-*.json file
   4. Dashboard auto-populates:
      - Stats: Total=5, Safe=2, Suspicious=1, Phishing=2, Avg Score=45
      - Bar chart updates with threat distribution
      - Table renders with all reports
   ```

**Key Points to Highlight**:
- ✅ **No backend required**: Pure JavaScript import
- ✅ **Manual control**: User decides when to export/import
- ✅ **Standardized format**: JSON is human-readable and auditable
- ✅ **Cross-platform**: Same report works anywhere

---

### Part 4: Dashboard Analytics & PDF Export (2 min)

**Goal**: Demonstrate analytics and professional report generation.

**Steps**:

1. **View Analytics Dashboard**
   ```
   After importing reports, show:
   
   Stats Cards:
   • Total Scans: 5
   • Safe Sites: 2 (green)
   • Suspicious: 1 (yellow)
   • Phishing Detected: 2 (red)
   • Avg Risk Score: 45/100
   ```

2. **Examine Table with Visual Scores**
   ```
   Table columns:
   • Date & Time: 2024-12-27 15:30:00
   • Domain: test-login.xyz
   • Risk Level: [🔴 PHISHING] (red badge)
   • Risk Score: [████████] 100/100 (visual bar)
   • Detection Reasons: [View (2 items)] (expandable)
   
   Click "View" to expand reasons.
   ```

3. **Threat Distribution Chart**
   ```
   Visual bar chart showing:
   • Safe: 40% height
   • Suspicious: 20% height
   • Phishing: 40% height
   ```

4. **Export to PDF**
   ```
   1. Click "Export to PDF"
   2. File saves: phishguard-report-2024-12-27.pdf
   3. Open PDF to show:
      - Header: "PhishGuard Security Report"
      - Generated date/time
      - Professional table format
      - All reports with risk levels and scores
   ```

**Key Points to Highlight**:
- ✅ **Professional output**: PDF is submission-ready
- ✅ **Visual indicators**: Color-coded badges and score bars
- ✅ **Expandable details**: Users can drill into reasons
- ✅ **Responsive design**: Works on desktop and mobile

---

### Part 5: Educational Content (1 min)

**Goal**: Show awareness/prevention features.

**Steps**:

1. **Open Learn Page**
   ```
   Navigate to: http://localhost:5000/learn.html
   
   Show sections:
   • Check the URL (domain verification tips)
   • Suspicious Emails (phishing email indicators)
   • Enable 2FA (two-factor authentication benefits)
   • Safe DNS (Cloudflare, OpenDNS recommendations)
   ```

2. **Highlight Key Takeaway**
   ```
   Display: "If it sounds too good to be true, it probably is."
   
   Explain: Phishing often lures via promises of money, prizes, or 
            urgent account warnings.
   ```

**Key Points to Highlight**:
- ✅ **Practical prevention tips**: Users learn to stay safe
- ✅ **Modern design**: Professional, mobile-responsive
- ✅ **Accessible**: Clear language, no jargon

---

## 🧪 Demo Test Cases

Use these scenarios during demonstration:

| URL | Expected Result | Action |
|-----|-----------------|--------|
| `https://google.com` | SAFE (0) | Show trusted site baseline |
| `https://test-login.xyz` | PHISHING (100) | Show new domain + keyword combo |
| `http://insecure-login.com` | SUSPICIOUS (40–50) | Show HTTP penalty |
| `https://facebook.com` | SAFE (0) | Show whitelisted major site |
| `https://secure-verify-account.ml` | PHISHING (70–100) | Show multiple risk factors |

---

## 💡 Key Concepts to Emphasize

### 1. **Offline Architecture**
```
Extension → No backend calls
Dashboard → No API requests (except jsPDF CDN)
All processing → Happens in user's browser
Privacy → Data never leaves device unless explicitly exported
```

### 2. **Deterministic Scoring**
```
Scoring algorithm → Always produces same result for same input
Transparent → User sees exact calculation breakdown
Auditable → Code is readable and verifiable
Reproducible → Results can be validated in any environment
```

### 3. **Cross-Browser Support**
```
BrowserAPI wrapper → Abstracts chrome.* vs browser.* APIs
Works on → Chrome, Brave, Edge, Firefox
Graceful fallback → Uses appropriate API for each browser
Future-proof → Easy to add new browsers
```

### 4. **Academic Quality**
```
Documentation → Complete ARCHITECTURE.md and README
Limitations → Clearly stated (simulated APIs)
Future work → Vision for enhancement
Code comments → Inline explanations of logic
```

---

## 📝 Evaluation Checklist

Use this during your demonstration:

- [ ] Extension loads without errors
- [ ] Auto-scan runs on every page
- [ ] Risk badges display (SAFE/SUSPICIOUS/PHISHING)
- [ ] Risk scores are 0–100
- [ ] Reasons are listed for each scan
- [ ] Export creates valid JSON file
- [ ] Dashboard imports JSON successfully
- [ ] Analytics stats update correctly
- [ ] Table renders with color-coded badges
- [ ] Chart visualizes threat distribution
- [ ] PDF export works and looks professional
- [ ] Learn page displays prevention tips
- [ ] No backend errors or console errors
- [ ] Responsive design works on mobile
- [ ] Demo mode labels are visible ("[DEMO MODE]")

---

## 🎓 For Academic Evaluators

**What This Demonstrates**:

✅ **Software Engineering**
- Modular architecture (extension + dashboard)
- Separation of concerns (UI, logic, storage)
- Clean interfaces (schemas, APIs)

✅ **Security Awareness**
- Phishing detection indicators
- Risk visualization
- User education component

✅ **Full-Stack Development**
- Frontend: HTML5, CSS3, Vanilla JS
- Extension APIs: Manifest V3, scripting, storage
- Cross-platform compatibility

✅ **Data Pipeline**
- Deterministic processing
- JSON serialization
- Visual reporting

✅ **Offline-First Design**
- No backend dependencies
- No paid APIs
- Standalone functionality

---

## 🚀 Quick Demo Script (Talk Track)

**Opening (30 sec)**
> "PhishGuard is an anti-phishing system that works entirely in your browser. It has two parts: a browser extension that automatically scans every page you visit, and a web dashboard for viewing analytics. Everything works offline—no backend servers, no APIs."

**Part 1 (1 min)**
> "Here's the extension loading. Notice it auto-scans as I visit different sites. Safe sites get a green checkmark, suspicious sites get a yellow warning, and phishing gets a red alert. The scoring is transparent—I can see exactly why each site was flagged."

**Part 2 (1 min)**
> "The score is deterministic, meaning the same URL always gets the same result. It factors in HTTPS status, domain age, and known phishing patterns. For demo purposes, new domains and phishing signatures are simulated—that's clearly labeled in the interface."

**Part 3 (1 min)**
> "When I export from the extension, I get a JSON file with all my scan reports. I can then import that into the dashboard to see analytics, view detailed breakdowns, and export a professional PDF report."

**Closing (30 sec)**
> "The entire system is built with vanilla JavaScript—no frameworks, no dependencies. It demonstrates full-stack security awareness, clean architecture, and a focus on privacy. The code is well-documented and ready for production."

---

**Demo Duration**: 5–10 minutes  
**Audience**: Academic evaluators, instructors, peers  
**Outcome**: Clear understanding of features, architecture, and quality
