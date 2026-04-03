// Open dashboard
document.getElementById("openDashboard").addEventListener("click", async () => {
  await chrome.tabs.create({
    url: "http://localhost:5173/dashboard"
  });
});

document.getElementById("analyze").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  const url = tab.url;

  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

  if (!match) {
    alert("Not a valid Google Maps location");
    return;
  }

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);

  console.log("LAT:", lat, "LNG:", lng);

  const res = await fetch("http://127.0.0.1:8000/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ lat, lng })
  });

  const result = await res.json();
  console.log("REAL Analysis:", result);
});

document.getElementById("download").addEventListener("click", async () => {
  const res = await fetch("http://127.0.0.1:8000/zones");
  const data = await res.json();

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tree_equity_report.json";
  a.click();
});

// Open landing
document.getElementById("openLanding").addEventListener("click", async () => {
  await chrome.tabs.create({
    url: "http://localhost:5173/"
  });
});

// Fetch zones and render
async function fetchZones() {
  try {
    const res = await fetch("http://127.0.0.1:8000/zones");

    const data = await res.json();
    console.log("DATA:", data);

    if (!Array.isArray(data)) {
      throw new Error("Data is not an array");
    }

    const container = document.getElementById("zones");
    container.innerHTML = "";

    data.forEach(zone => {
      const div = document.createElement("div");

      const isHigh = zone.score > 0.7;

      div.className = `zone-card ${isHigh ? "zone-high" : "zone-low"}`;

      const treesNeeded = Math.round((1 - zone.score) * 100);

      div.innerHTML = `
        <strong>Zone ${zone.id}</strong><br/>
        Score: ${zone.score}<br/>
        🌳 Trees needed: ${treesNeeded}<br/>
        ${isHigh ? "🌱 Good coverage" : "⚠️ Needs improvement"}
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Error fetching zones:", err);
  }
}



// Run on load
fetchZones();