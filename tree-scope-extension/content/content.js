window.__TREESCOPE_STATE__ = window.__TREESCOPE_STATE__ || {
  overlayEnabled: false,
  currentMode: 'planting',
  gridData: [],
  lastUpdated: null,
  overlayRoot: null,
  tooltipRoot: null,
  badgeRoot: null
};

console.log('🌿 TreeScope initialized');

const ROWS = 15;
const COLS = 15;

let cellWidth, cellHeight;
let lastHoveredCell = null;

function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function initUI() {
  if (!document.getElementById('treescape-overlay-root')) {
    window.__TREESCOPE_STATE__.overlayRoot = document.createElement('div');
    window.__TREESCOPE_STATE__.overlayRoot.id = 'treescape-overlay-root';
    document.body.appendChild(window.__TREESCOPE_STATE__.overlayRoot);
    
    window.__TREESCOPE_STATE__.badgeRoot = document.createElement('div');
    window.__TREESCOPE_STATE__.badgeRoot.id = 'treescape-badge';
    document.body.appendChild(window.__TREESCOPE_STATE__.badgeRoot);
    
    window.__TREESCOPE_STATE__.tooltipRoot = document.createElement('div');
    window.__TREESCOPE_STATE__.tooltipRoot.id = 'treescape-tooltip';
    document.body.appendChild(window.__TREESCOPE_STATE__.tooltipRoot);

    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
  } else {
    window.__TREESCOPE_STATE__.overlayRoot = document.getElementById('treescape-overlay-root');
    window.__TREESCOPE_STATE__.badgeRoot = document.getElementById('treescape-badge');
    window.__TREESCOPE_STATE__.tooltipRoot = document.getElementById('treescape-tooltip');
  }
}

function renderGrid() {
  const state = window.__TREESCOPE_STATE__;
  if (!state.overlayEnabled) {
    if(state.overlayRoot) state.overlayRoot.style.display = 'none';
    if(state.badgeRoot) state.badgeRoot.style.display = 'none';
    if(state.tooltipRoot) state.tooltipRoot.style.display = 'none';
    return;
  }
  
  initUI();
  state.overlayRoot.style.display = 'block';
  state.badgeRoot.style.display = 'flex';
  state.overlayRoot.innerHTML = ''; 
  
  let generatedCells = [];
  
  cellWidth = window.innerWidth / COLS;
  cellHeight = window.innerHeight / ROWS;
  
  let modeSeedOffset = state.currentMode === 'planting' ? 0 : (state.currentMode === 'heat' ? 1000 : 2000);
  
  let total = ROWS * COLS;
  
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let seed = r * 100 + c + modeSeedOffset;
      let rand = seededRandom(seed);
      let rand2 = seededRandom(seed + 500);
      
      let score = Math.floor(rand * 100);
      let classification, colorStr, ttColorClass;
      
      if (score >= 70) {
        classification = 'High Potential';
        colorStr = 'rgba(16, 185, 129, 0.4)'; 
        ttColorClass = 'tt-color-green';
      } else if (score >= 40) {
        classification = 'Moderate / Review';
        colorStr = 'rgba(14, 165, 233, 0.4)'; 
        ttColorClass = 'tt-color-teal';
      } else {
        classification = 'Restricted';
        colorStr = 'rgba(239, 68, 68, 0.4)'; 
        ttColorClass = 'tt-color-red';
      }
      
      let data = generateMockData(score, rand2, state.currentMode);
      
      const cellData = {
        id: `G-${r}-${c}`,
        row: r, col: c, 
        score, classification, colorStr, ttColorClass, 
        recommendedTree: data.treeSuggestion,
        waterNeed: data.waterNeed,
        why: data.why,
        mode: state.currentMode
      };
      
      generatedCells.push(cellData);
      
      const cellEl = document.createElement('div');
      cellEl.id = `ts-cell-${r}-${c}`;
      cellEl.className = 'treescape-grid-cell';
      cellEl.style.width = cellWidth + 'px';
      cellEl.style.height = cellHeight + 'px';
      cellEl.style.left = (c * cellWidth) + 'px';
      cellEl.style.top = (r * cellHeight) + 'px';
      cellEl.style.backgroundColor = colorStr;
      
      state.overlayRoot.appendChild(cellEl);
    }
  }

  // Update State cache
  state.gridData = generatedCells;
  state.lastUpdated = Date.now();
  console.log('🌿 Grid generated:', generatedCells.length);

  let modeLabel = state.currentMode === 'planting' ? "Planting Potential" : (state.currentMode === 'heat' ? "Heat Risk" : "Water Constraint");
  state.badgeRoot.innerHTML = `
    <div class="treescape-badge-title">TreeScope Overlay Active</div>
    <div class="treescape-badge-row"><span>Mode:</span> <span class="treescape-badge-val">${modeLabel}</span></div>
    <div class="treescape-badge-row"><span>Cells Analyzed:</span> <span class="treescape-badge-val">${total}</span></div>
  `;
}

function generateMockData(score, r2, mode) {
  let treeTypes = ["Neem", "Rain Tree", "Native Shade Tree", "Silver Oak", "Banyan", "Ficus", "Jacaranda"];
  let reasons = {};
  
  if (mode === 'planting') {
    reasons = {
      high: "Lower obstruction and moderate heat burden make this zone highly favorable.",
      mod: "Possible utility conflicts or narrow sidewalk, requires physical review.",
      low: "Overlaps with probable road infrastructure or building footprint."
    };
  } else if (mode === 'heat') {
    reasons = {
      high: "High heat exposure area—priority for urgent cooling canopy addition.",
      mod: "Moderate urban heat island effect detected.",
      low: "Low heat risk or insufficient plantable area."
    };
  } else {
    reasons = {
      high: "Accessible irrigation and excellent natural drainage.",
      mod: "Average water needs; recommend drought-tolerant species.",
      low: "Poor water catchment or restrictive concrete surfaces."
    };
  }
  
  let waterNeed = ['Low', 'Medium', 'High'][Math.floor(r2 * 3)];
  let why = score >= 70 ? reasons.high : (score >= 40 ? reasons.mod : reasons.low);
  
  return {
    treeSuggestion: treeTypes[Math.floor(r2 * treeTypes.length)],
    waterNeed,
    why
  };
}

function handleMouseMove(e) {
  const state = window.__TREESCOPE_STATE__;
  if (!state.overlayEnabled || state.gridData.length === 0) return;
  
  let c = Math.floor(e.clientX / cellWidth);
  let r = Math.floor(e.clientY / cellHeight);
  
  if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
    if (lastHoveredCell && lastHoveredCell.r === r && lastHoveredCell.c === c) {
      if(state.tooltipRoot) {
          state.tooltipRoot.style.left = (e.clientX + 15) + 'px';
          state.tooltipRoot.style.top = (e.clientY + 15) + 'px';
      }
      return;
    }
    
    if (lastHoveredCell) {
      let oldEl = document.getElementById(`ts-cell-${lastHoveredCell.r}-${lastHoveredCell.c}`);
      if (oldEl) oldEl.classList.remove('hovered');
    }
    
    let el = document.getElementById(`ts-cell-${r}-${c}`);
    if (el) el.classList.add('hovered');
    lastHoveredCell = {r, c};
    
    let idx = r * COLS + c;
    const data = state.gridData[idx];
    if(!data || !state.tooltipRoot) return;
    
    state.tooltipRoot.innerHTML = `
      <div class="treescape-tt-header">
        <span>Zone: ${data.id}</span>
        <span class="${data.ttColorClass}">Score: ${data.score}</span>
      </div>
      <div class="treescape-tt-row">
        <span class="treescape-tt-label">Class:</span>
        <span class="treescape-tt-val ${data.ttColorClass}">${data.classification}</span>
      </div>
      <div class="treescape-tt-row">
        <span class="treescape-tt-label">Tree:</span>
        <span class="treescape-tt-val">${data.recommendedTree}</span>
      </div>
      <div class="treescape-tt-row">
        <span class="treescape-tt-label">Water Need:</span>
        <span class="treescape-tt-val">${data.waterNeed}</span>
      </div>
      <div class="treescape-tt-why">
         ${data.why}
      </div>
    `;
    
    state.tooltipRoot.style.display = 'block';
    
    let ttRect = state.tooltipRoot.getBoundingClientRect();
    let leftPos = e.clientX + 15;
    let topPos = e.clientY + 15;
    if (leftPos + ttRect.width > window.innerWidth) leftPos = e.clientX - ttRect.width - 15;
    if (topPos + ttRect.height > window.innerHeight) topPos = e.clientY - ttRect.height - 15;
    
    state.tooltipRoot.style.left = leftPos + 'px';
    state.tooltipRoot.style.top = topPos + 'px';
  } else {
    if (lastHoveredCell) {
       let oldEl = document.getElementById(`ts-cell-${lastHoveredCell.r}-${lastHoveredCell.c}`);
       if (oldEl) oldEl.classList.remove('hovered');
    }
    lastHoveredCell = null;
    if(state.tooltipRoot) state.tooltipRoot.style.display = 'none';
  }
}

function handleResize() {
  if (window.__TREESCOPE_STATE__.overlayEnabled) {
    renderGrid();
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const state = window.__TREESCOPE_STATE__;
  
  if (request.action === 'PING_TREESCOPE') {
    console.log('🌿 PING_TREESCOPE received');
    sendResponse({ ok: true, active: true });
    return true;
  }
  
  if (request.action === 'ENABLE_OVERLAY') {
    console.log(`🌿 ENABLE_OVERLAY mode:${request.mode}`);
    state.overlayEnabled = true;
    state.currentMode = request.mode;
    renderGrid();
    sendResponse({ ok: true });
    return true;
  }
  
  if (request.action === 'DISABLE_OVERLAY') {
    console.log('🌿 DISABLE_OVERLAY');
    state.overlayEnabled = false;
    renderGrid();
    sendResponse({ ok: true });
    return true;
  }

  if (request.action === 'REFRESH_OVERLAY') {
    console.log('🌿 REFRESH_OVERLAY received');
    state.overlayEnabled = true;
    if (request.mode) state.currentMode = request.mode;
    state.currentMode += '_r'; 
    if(state.currentMode.includes('_r_r')) state.currentMode = state.currentMode.split('_')[0];
    
    renderGrid();
    sendResponse({ ok: true, generatedLength: state.gridData.length });
    return true;
  }
  
  if (request.action === 'GET_GRID_DATA') {
    console.log('🌿 GET_GRID_DATA requested');
    if (state.gridData.length === 0 && state.overlayEnabled) {
      console.log('🌿 Initiating auto-regeneration...');
      renderGrid();
    }
    
    if (state.gridData.length > 0) {
      console.log('🌿 Returning gridData length:', state.gridData.length);
      sendResponse({
        ok: true,
        gridData: state.gridData,
        mode: state.currentMode,
        lastUpdated: state.lastUpdated
      });
    } else {
      console.log('🌿 Failed to return gridData - it is still empty.');
      sendResponse({
        ok: false,
        error: 'Grid data is empty after attempted regeneration'
      });
    }
    return true;
  }
});
