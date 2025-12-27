document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('import-file');
    const tableBody = document.querySelector('#reports-table tbody');
    const btnExportPdf = document.getElementById('btn-export-pdf');

    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statSafe = document.getElementById('stat-safe');
    const statSuspicious = document.getElementById('stat-suspicious');
    const statPhishing = document.getElementById('stat-phishing');

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
                currentReports = reports;
                renderDashboard(reports);
            } catch (err) {
                alert('Invalid JSON file.');
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

            doc.text("PhishGuard Security Report", 14, 20);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

            const tableColumn = ["Date", "Domain", "Status", "Score", "Reasons"];
            const tableRows = [];

            currentReports.forEach(report => {
                const reportData = [
                    new Date(report.timestamp).toLocaleDateString(),
                    report.domain,
                    report.status,
                    report.score,
                    report.reasons.join(', ')
                ];
                tableRows.push(reportData);
            });

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 35,
            });

            doc.save("phishguard-report.pdf");
        } catch (e) {
            console.error(e);
            alert('PDF Export failed. Ensure internet is active to load jsPDF library or use a local copy.');
        }
    });

    function renderDashboard(reports) {
        // Clear table
        tableBody.innerHTML = '';

        if (reports.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No records found.</td></tr>';
            return;
        }

        // Stats
        let safe = 0, suspicious = 0, phishing = 0;

        reports.forEach(report => {
            if (report.status === 'SAFE') safe++;
            else if (report.status === 'SUSPICIOUS') suspicious++;
            else if (report.status === 'PHISHING') phishing++;

            // Row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(report.timestamp).toLocaleDateString()} ${new Date(report.timestamp).toLocaleTimeString()}</td>
                <td>${report.domain}</td>
                <td><span class="status-label status-${report.status}">${report.status}</span></td>
                <td>${report.score}</td>
                <td>${report.reasons.join(', ')}</td>
            `;
            tableBody.appendChild(row);
        });

        // Update Stats UI
        statTotal.textContent = reports.length;
        statSafe.textContent = safe;
        statSuspicious.textContent = suspicious;
        statPhishing.textContent = phishing;

        // Update Chart
        const max = Math.max(safe, suspicious, phishing, 1); // Avoid div by 0
        barSafe.style.height = `${(safe / max) * 100}%`;
        barSuspicious.style.height = `${(suspicious / max) * 100}%`;
        barPhishing.style.height = `${(phishing / max) * 100}%`;
    }
});
