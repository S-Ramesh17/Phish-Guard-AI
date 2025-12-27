document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('import-file');
    const tableBody = document.querySelector('#reports-table tbody');
    const btnExportPdf = document.getElementById('btn-export-pdf');

    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statSafe = document.getElementById('stat-safe');
    const statSuspicious = document.getElementById('stat-suspicious');
    const statPhishing = document.getElementById('stat-phishing');
    const statAvgScore = document.getElementById('stat-avg-score');

    // Chart Elements
    const barSafe = document.getElementById('bar-safe');
    const barSuspicious = document.getElementById('bar-suspicious');
    const barPhishing = document.getElementById('bar-phishing');

    let currentReports = [];

    // File Import Listener
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const reports = JSON.parse(event.target.result);
                
                // Validate reports
                if (Array.isArray(reports)) {
                    currentReports = reports;
                    renderDashboard(reports);
                } else {
                    alert('Invalid format. Expected an array of reports.');
                }
            } catch (err) {
                alert('Invalid JSON file. Please export from PhishGuard Extension.');
                console.error('Parse error:', err);
            }
        };
        reader.readAsText(file);
    });

    // PDF Export Listener
    btnExportPdf.addEventListener('click', () => {
        if (currentReports.length === 0) {
            alert('No reports to export. Import data first.');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(14);
            doc.text("PhishGuard Security Report", 14, 20);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);

            const tableColumn = ["Date", "Domain", "Risk Level", "Score", "Key Reasons"];
            const tableRows = [];

            currentReports.forEach(report => {
                const reportData = [
                    new Date(report.timestamp).toLocaleDateString(),
                    report.domain,
                    report.riskLevel || 'UNKNOWN',
                    `${report.riskScore || 0}/100`,
                    report.detectionReasons ? report.detectionReasons.slice(0, 2).join(', ') : 'N/A'
                ];
                tableRows.push(reportData);
            });

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                margin: 10,
                didDrawPage: (data) => {
                    const pageCount = doc.internal.pages.length - 1;
                    doc.setFontSize(10);
                    doc.text(
                        `Page ${pageCount}`,
                        doc.internal.pageSize.getWidth() / 2,
                        doc.internal.pageSize.getHeight() - 10,
                        { align: 'center' }
                    );
                }
            });

            doc.save(`phishguard-report-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (e) {
            console.error('PDF export error:', e);
            alert('PDF export failed. Ensure jsPDF library is loaded.');
        }
    });

    function renderDashboard(reports) {
        // Clear table
        tableBody.innerHTML = '';

        if (reports.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No records found.</td></tr>';
            updateStats(0, 0, 0, 0, 0);
            return;
        }

        // Stats
        let safe = 0, suspicious = 0, phishing = 0, totalScore = 0;

        reports.forEach(report => {
            const riskLevel = report.riskLevel || 'UNKNOWN';
            
            if (riskLevel === 'SAFE') safe++;
            else if (riskLevel === 'SUSPICIOUS') suspicious++;
            else if (riskLevel === 'PHISHING') phishing++;

            totalScore += (report.riskScore || 0);

            // Create table row
            const row = document.createElement('tr');
            const riskColor = getRiskColor(riskLevel);
            const riskIcon = getRiskIcon(riskLevel);
            const score = Math.round(report.riskScore || 0);

            row.innerHTML = `
                <td>${new Date(report.timestamp).toLocaleDateString()} ${new Date(report.timestamp).toLocaleTimeString()}</td>
                <td><code>${report.domain || 'Unknown'}</code></td>
                <td>
                    <span class="risk-badge" style="background-color: ${riskColor}; color: white;">
                        ${riskIcon} ${riskLevel}
                    </span>
                </td>
                <td>
                    <div class="score-bar-container">
                        <div class="score-bar" style="width: ${score}%; background-color: ${riskColor};"></div>
                    </div>
                    <span class="score-text">${score}/100</span>
                </td>
                <td>
                    <details>
                        <summary>View (${report.detectionReasons ? report.detectionReasons.length : 0})</summary>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            ${report.detectionReasons ? report.detectionReasons.map(r => `<li style="font-size: 0.85rem;">${r}</li>`).join('') : '<li>No reasons</li>'}
                        </ul>
                    </details>
                </td>
            `;
            tableBody.appendChild(row);
        });

        const avgScore = reports.length > 0 ? Math.round(totalScore / reports.length) : 0;
        updateStats(reports.length, safe, suspicious, phishing, avgScore);

        // Update Chart
        const max = Math.max(safe, suspicious, phishing, 1);
        barSafe.style.height = `${(safe / max) * 100}%`;
        barSuspicious.style.height = `${(suspicious / max) * 100}%`;
        barPhishing.style.height = `${(phishing / max) * 100}%`;
    }

    function updateStats(total, safe, suspicious, phishing, avgScore) {
        statTotal.textContent = total;
        statSafe.textContent = safe;
        statSuspicious.textContent = suspicious;
        statPhishing.textContent = phishing;
        statAvgScore.textContent = avgScore;
    }

    function getRiskColor(riskLevel) {
        switch (riskLevel) {
            case 'SAFE': return '#28a745';
            case 'SUSPICIOUS': return '#ffc107';
            case 'PHISHING': return '#dc3545';
            default: return '#6c757d';
        }
    }

    function getRiskIcon(riskLevel) {
        switch (riskLevel) {
            case 'SAFE': return '✓';
            case 'SUSPICIOUS': return '⚠';
            case 'PHISHING': return '✕';
            default: return '?';
        }
    }
});
