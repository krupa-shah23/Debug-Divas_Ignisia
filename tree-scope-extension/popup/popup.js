document.addEventListener('DOMContentLoaded', async () => {
  const toggleOverlay = document.getElementById('toggle-overlay');
  const modeSelect = document.getElementById('mode-select');
  const refreshBtn = document.getElementById('refresh-btn');
  const pdfBtn = document.getElementById('pdf-btn');

  // Load saved state
  chrome.storage.local.get(['overlayEnabled', 'overlayMode'], (result) => {
    toggleOverlay.checked = result.overlayEnabled || false;
    modeSelect.value = result.overlayMode || 'planting';
    updateContentScript();
  });

  toggleOverlay.addEventListener('change', () => {
    chrome.storage.local.set({ overlayEnabled: toggleOverlay.checked });
    updateContentScript();
  });

  modeSelect.addEventListener('change', () => {
    chrome.storage.local.set({ overlayMode: modeSelect.value });
    if (toggleOverlay.checked) {
      updateContentScript();
    }
  });

  refreshBtn.addEventListener('click', () => {
    if (!toggleOverlay.checked) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "REFRESH_OVERLAY", mode: modeSelect.value }, (resp) => {
         console.log('🌿 REFRESH_OVERLAY response:', resp);
      });
    });
  });

  pdfBtn.addEventListener('click', async () => {
    console.log('🌿 PDF clicked');
    const originalText = pdfBtn.innerText;
    pdfBtn.innerText = "Generating...";
    pdfBtn.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      
      // Ping check
      chrome.tabs.sendMessage(tabId, { action: "PING_TREESCOPE" }, (pingResult) => {
         console.log('🌿 PING response:', pingResult);
         
         if (chrome.runtime.lastError || !pingResult) {
            console.warn('Ping failed, perhaps not on map tab.');
            alert("Warning: TreeScope is not detected on the current page. Make sure you are on Google Maps.");
            resetButton();
            return;
         }

         // Fetch data
         chrome.tabs.sendMessage(tabId, { action: "GET_GRID_DATA" }, (dataResult) => {
            console.log('🌿 GET_GRID_DATA response:', dataResult);
            
            if (!dataResult || !dataResult.ok) {
                // Secondary recovery
                console.log('🌿 Trying secondary recovery via REFRESH_OVERLAY...');
                chrome.tabs.sendMessage(tabId, { action: "REFRESH_OVERLAY", mode: modeSelect.value }, (refreshResult) => {
                    console.log('🌿 REFRESH_OVERLAY recovery response:', refreshResult);
                    chrome.tabs.sendMessage(tabId, { action: "GET_GRID_DATA" }, (recoveryData) => {
                        if(!recoveryData || !recoveryData.ok) {
                           alert("Cannot generate PDF: " + (recoveryData?.error || "Still no data available."));
                           resetButton();
                        } else {
                           generatePDF(recoveryData.gridData);
                           resetButton();
                        }
                    });
                });
            } else {
                generatePDF(dataResult.gridData);
                resetButton();
            }
         });
      });
    });

    function resetButton() {
       pdfBtn.innerText = originalText;
       pdfBtn.disabled = false;
    }
  });

  function updateContentScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if(tabs[0].url.includes("google.com/maps")) {
        const action = toggleOverlay.checked ? "ENABLE_OVERLAY" : "DISABLE_OVERLAY";
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: action, 
          mode: modeSelect.value
        });
      }
    });
  }

  function generatePDF(gridData) {
     const { jsPDF } = window.jspdf;
     const doc = new jsPDF();
     
     let stats = {
       total: gridData.length,
       high: gridData.filter(d => d.score >= 70).length,
       moderate: gridData.filter(d => d.score >= 40 && d.score < 70).length,
       restricted: gridData.filter(d => d.score < 40).length,
     };

     let topZones = [...gridData].sort((a,b) => b.score - a.score).slice(0, 5);

     // Title Page Background
     doc.setFillColor(15, 23, 42);
     doc.rect(0, 0, 210, 297, 'F');
     
     doc.setTextColor(255, 255, 255);
     doc.setFont("helvetica", "bold");
     doc.setFontSize(28);
     doc.text("TreeScope", 20, 40);
     doc.setFont("helvetica", "normal");
     doc.setFontSize(16);
     doc.text("Urban Tree Planning Report", 20, 50);

     doc.setFontSize(12);
     doc.setTextColor(148, 163, 184);
     doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 60);

     doc.setFillColor(255, 255, 255);
     doc.rect(20, 80, 170, 200, 'F');

     // Content Box
     doc.setTextColor(15, 23, 42);
     doc.setFontSize(18);
     doc.setFont("helvetica", "bold");
     doc.text("Analysis Summary", 30, 95);

     doc.setFont("helvetica", "normal");
     doc.setFontSize(12);
     doc.text(`Total Zones Analyzed: ${stats.total}`, 30, 110);
     
     // Stat cards
     doc.setDrawColor(226, 232, 240);
     doc.setFillColor(248, 250, 252);
     
     doc.roundedRect(30, 120, 45, 25, 3, 3, 'FD');
     doc.setTextColor(16, 185, 129); // Green
     doc.text("High Potential", 35, 130);
     doc.setFontSize(16);
     doc.setFont("helvetica", "bold");
     doc.text(`${stats.high}`, 35, 140);
     
     doc.setFont("helvetica", "normal");
     doc.setFontSize(12);
     doc.roundedRect(80, 120, 50, 25, 3, 3, 'FD');
     doc.setTextColor(14, 165, 233); // Teal
     doc.text("Moderate / Review", 85, 130);
     doc.setFontSize(16);
     doc.setFont("helvetica", "bold");
     doc.text(`${stats.moderate}`, 85, 140);

     doc.setFont("helvetica", "normal");
     doc.setFontSize(12);
     doc.roundedRect(135, 120, 45, 25, 3, 3, 'FD');
     doc.setTextColor(239, 68, 68); // Red
     doc.text("Restricted", 140, 130);
     doc.setFontSize(16);
     doc.setFont("helvetica", "bold");
     doc.text(`${stats.restricted}`, 140, 140);

     doc.setTextColor(15, 23, 42);
     doc.setFont("helvetica", "bold");
     doc.setFontSize(14);
     doc.text("Map Snapshot", 30, 165);
     
     doc.setFont("helvetica", "italic");
     doc.setFontSize(10);
     doc.setTextColor(100, 116, 139);
     doc.text("(Live viewport export can be enabled in production build)", 30, 172);

     doc.setDrawColor(203, 213, 225);
     doc.setFillColor(241, 245, 249);
     doc.roundedRect(30, 178, 150, 40, 3, 3, 'FD');
     doc.setFont("helvetica", "normal");
     doc.setTextColor(148, 163, 184);
     doc.text("Map View Placeholder", 80, 200);

     // Second Page
     doc.addPage();
     doc.setTextColor(15, 23, 42);
     doc.setFont("helvetica", "bold");
     doc.setFontSize(18);
     doc.text("Top Recommendations & Insights", 20, 30);
     
     doc.setFontSize(12);
     doc.setFont("helvetica", "normal");
     doc.text("• High potential zones are concentrated near lower heat burden streets.", 20, 45);
     doc.text("• Restricted zones overlap probable road and built-up segments.", 20, 53);
     doc.text("• Moderate zones may require manual review for utility conflicts.", 20, 61);

     // Top recommended zones table
     doc.setFont("helvetica", "bold");
     doc.setFontSize(14);
     doc.text("Top 5 Recommended Zones", 20, 80);
     
     let startY = 90;
     doc.setFontSize(10);
     doc.setFillColor(241, 245, 249);
     doc.rect(20, startY, 170, 10, 'F');
     doc.text("Zone ID", 25, startY + 7);
     doc.text("Suitability", 50, startY + 7);
     doc.text("Tree Suggestion", 80, startY + 7);
     doc.text("Water Need", 140, startY + 7);

     doc.setFont("helvetica", "normal");
     startY += 12;

     topZones.forEach((zone, i) => {
        doc.text(zone.id, 25, startY);
        doc.text(zone.score.toString(), 50, startY);
        doc.text(zone.recommendedTree.substring(0, 30), 80, startY);
        doc.text(zone.waterNeed, 140, startY);
        startY += 10;
     });

     doc.save(`TreeScope_Report_${Date.now()}.pdf`);
  }
});
