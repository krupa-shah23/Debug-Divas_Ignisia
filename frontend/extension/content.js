console.log("🔥 CONTENT SCRIPT INJECTED");

let lastUrl = location.href;

setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log("🔄 Map moved → updating overlay");

        document.getElementById("tree-overlay")?.remove();
        loadZones();
    }
}, 1000);

function waitForMap() {
    const map = document.querySelector("canvas");

    if (map) {
        console.log("🗺️ Map detected");
        loadZones();
    } else {
        setTimeout(waitForMap, 1000);
    }
}

function getMapCenter() {
    const match = location.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (!match) return null;

    return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
    };
}

function observeMapMovement() {
    const mapContainer = document.querySelector("canvas")?.parentElement;

    if (!mapContainer) {
        console.log("❌ Map container not found");
        return;
    }

    console.log("👀 Observing map movement...");

    const observer = new MutationObserver(() => {
        console.log("🧭 Map moved (DOM change)");

        document.getElementById("tree-overlay")?.remove();
        loadZones();
    });

    observer.observe(mapContainer, {
        attributes: true,
        childList: true,
        subtree: true
    });
}

waitForMap();

async function loadZones() {
    try {
        console.log("📡 Fetching zones directly...");

        const res = await fetch("http://localhost:8000/zones");
        const zones = await res.json();

        console.log("✅ ZONES:", zones);

        drawOverlay(zones);

    } catch (e) {
        console.error("❌ Failed to load zones", e);
    }
}

function createOverlay() {
    let overlay = document.getElementById("tree-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "tree-overlay";

        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.pointerEvents = "none";
        overlay.style.zIndex = "9999";

        document.body.appendChild(overlay);
    }

    return overlay;
}

function drawOverlay(zones) {
    const overlay = createOverlay();
    overlay.innerHTML = "";

    const center = getMapCenter();

    if (!center) {
        console.log("❌ No map center");
        return;
    }

    console.log("📍 Using center:", center);

    zones.forEach((zone, i) => {
        const box = document.createElement("div");

        const isHigh = zone.score > 0.7;

        // 🔥 Position relative to center
        const offsetX = (zone.id - 2) * 120; // spread left/right
        const offsetY = i * 100;

        box.style.position = "absolute";
        box.style.top = `calc(50% + ${offsetY}px)`;
        box.style.left = `calc(50% + ${offsetX}px)`;

        box.style.width = "120px";
        box.style.height = "80px";
        box.style.background = isHigh
            ? "rgba(34,197,94,0.5)"
            : "rgba(239,68,68,0.5)";
        box.style.border = "1px solid black";
        box.style.transform = "translate(-50%, -50%)"; // center anchor

        box.innerHTML = `
          <strong>Zone ${zone.id}</strong><br/>
          Score: ${zone.score}
        `;

        overlay.appendChild(box);
    });
}


