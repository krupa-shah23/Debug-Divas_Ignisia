chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📩 MESSAGE RECEIVED:", request);

  if (request.type === "PING") {
    sendResponse({ msg: "pong" });
  }

  if (request.type === "GET_ZONES") {
    console.log("📡 Fetching zones...");

    fetch("http://127.0.0.1:8000/zones")
      .then(res => res.json())
      .then(data => {
        console.log("✅ DATA:", data);
        sendResponse({ data });
      })
      .catch(err => {
        console.error("❌ FETCH ERROR:", err);
        sendResponse({ error: err.toString() });
      });

    return true;
  }
});