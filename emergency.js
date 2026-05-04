// emergency.js
console.log("✅ emergency.js LOADED");

function formatPhoneNumber(phone) {
    let digits = phone.replace(/\D/g, '').replace(/^0+/, '');
    if (!digits.startsWith('91')) digits = '91' + digits;
    return digits;
}

const userId = 'default';

async function loadContacts() {
    const contactListEl = document.getElementById("contactList");
    const sosStatusEl   = document.getElementById("sosStatus");
    try {
        const res = await fetch(`/api/caretakers/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch caretakers");
        const caretakers = await res.json();
        contactListEl.innerHTML = "";
        caretakers.forEach(c => {
            const li   = document.createElement("li");
            const text = document.createElement("span");
            text.textContent = `${c.name} (${c.phone}) - ${c.relation || "N/A"}`;
            const delBtn = document.createElement("button");
            delBtn.textContent = "❌";
            delBtn.style.marginLeft = "10px";
            delBtn.onclick = () => deleteContact(c.id);
            li.appendChild(text);
            li.appendChild(delBtn);
            contactListEl.appendChild(li);
        });
    } catch (err) {
        console.error(err);
        document.getElementById("sosStatus").textContent = "Error loading contacts.";
    }
}

async function addContact() {
    const name        = document.getElementById("contactName").value.trim();
    const phone       = document.getElementById("contactPhone").value.trim();
    const sosStatusEl = document.getElementById("sosStatus");

    if (!name || !phone)                          { alert("Please enter name and phone."); return; }
    if (phone.replace(/\D/g, '').length < 10)     { alert("Enter a valid phone number."); return; }

    try {
        const res = await fetch("/api/caretakers", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ userId, name, phone, relation: "Caretaker" })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Failed"); }
        const c = await res.json();
        document.getElementById("contactName").value  = "";
        document.getElementById("contactPhone").value = "";
        loadContacts();
        sosStatusEl.textContent = `Added ${c.name} successfully.`;
    } catch (err) {
        console.error(err);
        document.getElementById("sosStatus").textContent = "Failed to add: " + err.message;
    }
}

async function deleteContact(id) {
    if (!confirm("Remove this contact?")) return;
    try {
        const res = await fetch(`/api/caretakers/${id}`, { method: "DELETE" });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
        loadContacts();
        document.getElementById("sosStatus").textContent = "Contact removed.";
    } catch (err) {
        console.error(err);
        document.getElementById("sosStatus").textContent = "Failed to remove contact.";
    }
}

// ================= CORE SOS SENDER =================
// Called after location is obtained — builds UI and opens WhatsApp
function sendSOSToContacts(caretakers, latitude, longitude) {
    const sosStatusEl = document.getElementById("sosStatus");

    const locationUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    const now         = new Date().toLocaleString();
    const rawMessage  =
`🚨 SOS ALERT 🚨

A user of Sahaaya needs immediate help.

📍 Location:
${locationUrl}

🕒 Time:
${now}

Please check on them as soon as possible.`;

    const message = encodeURIComponent(rawMessage);

    // Build button UI for all contacts
    sosStatusEl.innerHTML = "";
    const container = document.createElement("div");
    container.innerHTML = "<p><strong>SOS ready. Tap to send:</strong></p>";

    caretakers.forEach((c, index) => {
        const phone = formatPhoneNumber(c.phone);
        const url   = `https://wa.me/${phone}?text=${message}`;

        const btn = document.createElement("button");
        btn.textContent   = `📲 Send to ${c.name}`;
        btn.style.cssText = "display:block; margin:6px 0; padding:10px 16px; font-size:15px; cursor:pointer;";
        btn.onclick = () => { window.location.href = url; };  // same-tab navigation — never blocked
        container.appendChild(btn);

        // Auto-send to first contact using location.href — bypasses popup blocker
        if (index === 0) {
            console.log("📲 Auto-opening WhatsApp for:", c.name, url);
            if (typeof speak === "function") speak("Emergency alert sent");

            // Small delay so the UI renders before we navigate
            setTimeout(() => { window.location.href = url; }, 800);
        }
    });

    sosStatusEl.appendChild(container);
}

// ================= MAIN confirmSOS =================
window.confirmSOS = async function(skipConfirm = false) {
    const sosStatusEl = document.getElementById("sosStatus");

    if (!navigator.geolocation) {
        alert("Geolocation not supported by your browser.");
        return;
    }

    if (!skipConfirm) {
        const confirmed = confirm("Press OK to send SOS via WhatsApp to all caretakers.");
        if (!confirmed) return;
    }

    console.log("🚨 confirmSOS called, skipConfirm:", skipConfirm);
    sosStatusEl.textContent = "Getting your location...";
    if (typeof speak === "function") speak("Preparing emergency message");

    // Log SOS event to DB (fire and forget)
    navigator.geolocation.getCurrentPosition(async position => {
        const { latitude, longitude } = position.coords;
        console.log("📍 Location obtained:", latitude, longitude);

        // Save to DB
        try {
            await fetch("/api/sos", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ userId, latitude, longitude })
            });
        } catch (err) { console.error("Failed to log SOS:", err); }

        // Fetch caretakers
        try {
            const res        = await fetch(`/api/caretakers/${userId}`);
            const caretakers = await res.json();
            console.log("👥 Caretakers found:", caretakers.length);

            if (!caretakers.length) {
                sosStatusEl.textContent = "⚠️ No caretakers found. Please add emergency contacts.";
                return;
            }

            sendSOSToContacts(caretakers, latitude, longitude);

        } catch (err) {
            console.error(err);
            sosStatusEl.textContent = "Failed to send SOS: " + err.message;
        }

    }, err => {
        console.error("Geolocation error:", err);
        // If location fails, still try to send without it
        sosStatusEl.textContent = "⚠️ Could not get location. Trying without...";
        fetch(`/api/caretakers/${userId}`)
            .then(r => r.json())
            .then(caretakers => {
                if (caretakers.length) sendSOSToContacts(caretakers, "unknown", "unknown");
                else sosStatusEl.textContent = "No caretakers found.";
            })
            .catch(() => sosStatusEl.textContent = "Failed to reach server.");
    }, {
        timeout: 8000,           // don't wait forever for GPS
        maximumAge: 60000        // accept a cached position up to 1 min old
    });
};

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    loadContacts();

    // Auto-trigger SOS after redirect from voice command on another page
    if (localStorage.getItem("triggerSOS") === "true") {
        console.log("🚨 triggerSOS flag found — auto-firing in 1.5s");
        localStorage.removeItem("triggerSOS");
        setTimeout(() => {
            console.log("🚨 firing window.confirmSOS(true)");
            window.confirmSOS(true);
        }, 1500);
    }
});
