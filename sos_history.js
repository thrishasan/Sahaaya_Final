// public/sos_history.js

const userId = "default";

const historyList = document.getElementById("historyList");

async function loadSOSHistory() {
  historyList.innerHTML = "<li>Loading...</li>";

  try {
    const res = await fetch(`/api/sos/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch history");

    const events = await res.json();

    if (!events.length) {
      historyList.innerHTML = "<li>No SOS events recorded.</li>";
      return;
    }

    historyList.innerHTML = "";

    events.forEach(event => {
      const li = document.createElement("li");

      const date = new Date(event.timestamp).toLocaleString();

      const mapLink =
        `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;

      li.innerHTML = `
        <b>${date}</b><br>
        <a href="${mapLink}" target="_blank">View Location</a>
      `;

      historyList.appendChild(li);
    });

  } catch (err) {
    historyList.innerHTML = `<li>Error: ${err.message}</li>`;
  }
}

loadSOSHistory();