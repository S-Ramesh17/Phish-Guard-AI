# PhishGuard: Anti-Phishing Detection & Awareness System

**An Academic Project for Browser-Based Phishing Detection**

PhishGuard is a comprehensive anti-phishing system consisting of a cross-browser extension and a web-based dashboard. It provides real-time phishing detection, detailed risk scoring, and educational content—all designed for academic submission and demonstration.

## 🎯 Project Objectives

- **Detect** suspicious websites through multiple security indicators
- **Explain** detection reasons in clear, user-friendly language
- **Score** risk deterministically (0–100 scale) with transparent methodology
- **Report** findings with detailed analytics and export capabilities
- **Educate** users on phishing prevention and safe browsing practices
- **Work offline** without backend servers or paid APIs

## 📦 Features

### Browser Extension (PhishGuard)
- **Automatic Scanning**: Auto-scans every webpage on load
- **Manual Scanning**: Force re-scan with "Scan Now" button
- **Risk Scoring**: Deterministic 0–100 score based on 4 factors
- **Risk Levels**: Color-coded badges (SAFE / SUSPICIOUS / PHISHING)
- **Detection Reasons**: Lists specific indicators triggering each scan
- **Local Storage**: All reports stored in browser's sync storage (last 50 scans)
- **JSON Export**: Download reports for dashboard import
- **Cross-Browser**: Works on Chrome, Brave, Edge, Firefox (via wrapper)

### Web Dashboard (PhishGuard Hub)
- **Report Import**: Load JSON files exported from the extension
- **Analytics**: Visual stats (total, safe, suspicious, phishing)
- **Risk Distribution Chart**: Bar chart showing threat breakdown
- **Detailed Table**: Sortable table with risk badges and score visualization
- **PDF Export**: Generate professional PDF reports
- **Educational Content**: Prevention tips and safe browsing practices
- **Local Processing**: No data leaves your browser

## ⚙️ Risk Scoring Engine

PhishGuard uses a **deterministic 0–100 scoring system**:

| Factor | Points | Criteria |
|--------|--------|----------|
| **HTTPS Status** | 0–30 | Penalty for non-HTTPS connections |
| **Password Input** | 0–50 | Password input field on insecure page (bonus penalty) |
| **Domain Age (WHOIS)** | 0–40 | Newer domains (< 30 days) receive higher scores |
| **PhishTank Match** | 0–100 | Domain listed in phishing database (critical) |
| **TOTAL** | 0–100 | Sum of all factors, clamped to 0–100 |

**Risk Levels**:
- **SAFE** (0–39): No significant threats detected
- **SUSPICIOUS** (40–69): Multiple risk indicators present
- **PHISHING** (70–100): Critical threats; avoid immediately

## 📂 Project Structure

```
phishguard/
├── extension/                          # Browser Extension
│   ├── manifest.json                   # Manifest V3 configuration
│   ├── popup/
│   │   ├── popup.html                  # Extension UI
│   │   ├── popup.css                   # Styling
│   │   └── popup.js                    # Popup logic
│   ├── scripts/
│   │   └── content/
│   │       └── dom-scanner.js          # Auto-scan content script
│   ├── schemas/
│   │   └── report.js                   # Unified report schema
│   └── utils/
│       ├── browser-api.js              # Cross-browser API wrapper
│       ├── risk-scorer.js              # Risk calculation engine
│       ├── domain.js                   # Domain utilities (stub)
│       ├── whois.js                    # WHOIS simulation (stub)
│       └── phishtank.js                # PhishTank simulation (stub)
│
├── website/                            # Web Dashboard
│   ├── index.html                      # Landing page
│   ├── dashboard.html                  # Main dashboard
│   ├── learn.html                      # Educational content
│   ├── css/
│   │   └── styles.css                  # Unified styling
│   └── js/
│       └── dashboard.js                # Dashboard logic
│
├── server/
│   └── routes.ts                       # Static file serving
│
├── README.md                           # This file
├── ARCHITECTURE.md                     # Technical architecture
├── DEMO.md                             # Demo walkthrough
└── DEMO_MODE.md                        # Simulation & testing guide
```

## 🚀 Installation & Setup

### Prerequisites
- Chrome, Brave, Edge, or Firefox browser
- Node.js 20+ (for running the dashboard server, optional)

### Option 1: Extension Only (No Server)

1. **Clone or download the project**
```bash
unzip phishguard.zip
cd phishguard
```

2. **Load Extension**:
   - Open browser → `chrome://extensions/` (or `about:debugging#/runtime/this-firefox` for Firefox)
   - Enable **Developer Mode** (top-right toggle)
   - Click **Load Unpacked** (or **Load Temporary Add-on** for Firefox)
   - Select the `extension/` folder
   - PhishGuard icon should appear in your toolbar

3. **Test Auto-Scan**:
   - Visit any website (e.g., google.com)
   - Extension auto-scans the page
   - Click the icon to see results

4. **Export Reports**:
   - Click "Export Reports (JSON)"
   - Save the file to your computer

### Option 2: Full Setup with Dashboard (Recommended)

1. **Start Dashboard Server**:
```bash
npm install
npm run dev
```
Server runs on `http://localhost:5000`

2. **Load Extension** (see Option 1, steps 2–3)

3. **Access Dashboard**:
   - Open `http://localhost:5000/dashboard.html`
   - Or click "Open Dashboard" button in extension popup

4. **Import & View Reports**:
   - Click "Import Extension JSON"
   - Upload exported reports
   - View analytics and export to PDF

## 🧪 Testing & Demo Mode

### Demo Websites

Try scanning these domains to see different risk levels:

| URL | Expected Result | Reason |
|-----|-----------------|--------|
| `https://google.com` | SAFE | HTTPS, whitelisted, legitimate |
| `https://test-login.xyz` | PHISHING | New .xyz domain + "login" keyword |
| `https://secure-account-update.ml` | PHISHING | New .ml TLD + suspicious keywords |
| `https://insecure-login.com` (HTTP) | SUSPICIOUS | No HTTPS + "login" keyword |

### Demo Mode Labels

All WHOIS and PhishTank checks display `[DEMO MODE]` to clearly indicate they are simulated.

**Simulated Logic**:
- Domains ending in `.xyz`, `.ml`, `.ga` are treated as < 30 days old
- URLs containing keywords (login, verify, account, etc.) on non-whitelisted domains are flagged
- Major services (Google, Facebook, Apple, etc.) are whitelisted

## 🔒 Security & Privacy

- **No backend servers**: All processing happens in your browser
- **No data transmission**: Reports never leave your device
- **Open-source logic**: Scoring algorithm is transparent and auditable
- **Local storage only**: Uses browser's sync storage (encrypted by browser)
- **No tracking**: No analytics, beacons, or third-party requests

## 📊 Academic Highlights

### Contributions
1. **Unified Report Schema**: Consistent data structure for cross-platform use
2. **Deterministic Risk Scoring**: Reproducible 0–100 calculation
3. **Cross-Browser Wrapper**: Abstraction layer for API compatibility
4. **Demo Mode Labels**: Clear distinction between real and simulated checks
5. **Offline Architecture**: No backend dependencies or paid APIs

### Limitations & Future Work

**Current Limitations**:
- WHOIS and PhishTank checks are simulated (not real APIs)
- No machine learning or URL pattern analysis
- No image/screenshot comparison
- No DNS-level protection
- Limited to 50 stored reports (browser storage constraint)

**Future Enhancements**:
1. **Real API Integration**: Connect to actual WHOIS and PhishTank APIs
2. **Machine Learning**: Train models on phishing patterns
3. **Community Reporting**: Allow users to submit unknown threats
4. **Browser Warnings**: Pop-up alerts for high-risk sites
5. **Sync Across Devices**: Cloud-based report storage
6. **Advanced Analytics**: ML-based domain reputation scoring

## 🛠️ Technical Stack

| Component | Technology |
|-----------|-----------|
| **Extension** | Vanilla JavaScript, Chrome Manifest V3 |
| **Dashboard** | HTML5, CSS3, Vanilla JavaScript |
| **Server** | Express.js (static file serving) |
| **Storage** | Browser Sync Storage API (extension) |
| **Reports** | JSON export/import |
| **PDF Export** | jsPDF library (CDN) |
| **Styling** | CSS3 Grid/Flexbox, responsive design |

## 📝 File Descriptions

### Key Files

- **`extension/manifest.json`**: Declares permissions, scripts, UI
- **`extension/schemas/report.js`**: Unified PhishGuard Report interface
- **`extension/utils/browser-api.js`**: Cross-browser compatibility layer
- **`extension/utils/risk-scorer.js`**: Core risk calculation engine
- **`extension/popup/popup.js`**: Extension popup UI logic
- **`extension/scripts/content/dom-scanner.js`**: Automatic page scanning
- **`website/js/dashboard.js`**: Dashboard import/analytics/export logic
- **`server/routes.ts`**: Static file server configuration

### Documentation Files

- **`README.md`** (this file): Project overview and setup guide
- **`ARCHITECTURE.md`**: Technical architecture and design decisions
- **`DEMO.md`**: Step-by-step walkthrough for demonstration
- **`DEMO_MODE.md`**: Guide to simulation logic and testing

## 🎓 For Academic Evaluation

This project demonstrates:

✅ **Full-stack development**: Extension architecture, DOM manipulation, storage APIs
✅ **Deterministic algorithms**: Reproducible risk scoring with clear logic
✅ **Cross-browser compatibility**: API abstraction for multiple platforms
✅ **UI/UX design**: Modern, intuitive interfaces for both extension and dashboard
✅ **Data pipeline**: JSON import/export for manual data transfer
✅ **Offline-first design**: No backend dependencies or external APIs
✅ **Documentation**: Clear explanations of features, limitations, and future work

## 📋 Submission Checklist

- [x] Browser extension (Manifest V3 compatible)
- [x] Web dashboard with import/export
- [x] Unified report schema
- [x] Deterministic risk scoring (0–100)
- [x] Cross-browser API wrapper
- [x] Demo mode with labeled simulations
- [x] Responsive UI with color-coded badges
- [x] Complete documentation
- [x] No backend servers or paid APIs
- [x] Works offline and standalone

## 🤝 Contributing

This is an academic project. Suggestions for improvements welcome via issues or pull requests.

## 📄 License

Academic use. See LICENSE file for details.

---

**Generated**: December 2024  
**Status**: Ready for Academic Submission & Demonstration
