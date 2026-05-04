// ================= LANGUAGE DATA =================
const translations = {
    en: {
        heroTitle: "Care. Comfort. Dignity.",
        heroDesc: "Empowering senior citizens with safe, smart and compassionate care solutions.",
        servicesTitle: "Our Services",
        service1: "Home Nursing",
        service2: "Medicine Management",
        service3: "Smart Reminders",
        service4: "Health Records",
        service5: "Emergency Support",
        emergencyTitle: "Emergency First System",
        emergencyDesc: "One tap SOS. Instant caregiver and family alerts."
    },
    hi: {
        heroTitle: "देखभाल। आराम। सम्मान।",
        heroDesc: "वरिष्ठ नागरिकों को सुरक्षित और संवेदनशील देखभाल समाधान प्रदान करना।",
        servicesTitle: "हमारी सेवाएं",
        service1: "होम नर्सिंग",
        service2: "दवा प्रबंधन",
        service3: "स्मार्ट रिमाइंडर",
        service4: "स्वास्थ्य रिकॉर्ड",
        service5: "आपातकालीन सहायता",
        emergencyTitle: "आपातकालीन प्रणाली",
        emergencyDesc: "एक क्लिक में SOS। तुरंत परिवार को सूचना।"
    },
    ta: {
        heroTitle: "பாதுகாப்பு. நிம்மதி. மரியாதை.",
        heroDesc: "மூத்த குடிமக்களுக்கு பாதுகாப்பான மற்றும் அன்பான பராமரிப்பு.",
        servicesTitle: "எங்கள் சேவைகள்",
        service1: "வீட்டு செவிலியர்",
        service2: "மருந்து மேலாண்மை",
        service3: "நினைவூட்டல்கள்",
        service4: "மருத்துவ பதிவுகள்",
        service5: "அவசர உதவி",
        emergencyTitle: "அவசர அமைப்பு",
        emergencyDesc: "ஒரே அழுத்தத்தில் SOS. உடனடி அறிவிப்பு."
    },
    te: {
        heroTitle: "సంరక్షణ. సౌకర్యం. గౌరవం.",
        heroDesc: "వృద్ధులకు సురక్షిత మరియు దయతో కూడిన సంరక్షణ సేవలు.",
        servicesTitle: "మా సేవలు",
        service1: "హోమ్ నర్సింగ్",
        service2: "ఔషధ నిర్వహణ",
        service3: "స్మార్ట్ రిమైండర్లు",
        service4: "ఆరోగ్య రికార్డులు",
        service5: "అత్యవసర సహాయం",
        emergencyTitle: "అత్యవసర వ్యవస్థ",
        emergencyDesc: "ఒక ట్యాప్‌తో SOS. వెంటనే సమాచారం."
    }
};

// ================= APPLY LANGUAGE =================
window.applyLanguage = function(lang) {
        if (!translations[lang]) return;
    Object.keys(translations[lang]).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.textContent = translations[lang][key];
    });
}

// ================= DARK MODE =================
function initDarkMode() {
    const modeToggle = document.getElementById("modeToggle");
    if (!modeToggle) return;
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
        modeToggle.textContent = "☀️";
    }
    modeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const dark = document.body.classList.contains("dark");
        modeToggle.textContent = dark ? "☀️" : "🌙";
        localStorage.setItem("theme", dark ? "dark" : "light");
    });
}

// ================= MEDICINES =================
function addMedicine() {
    const name   = document.getElementById("medName").value.trim();
    const dosage = document.getElementById("medDosage").value.trim();
    const time   = document.getElementById("medTime").value;
    if (!name || !dosage || !time) return;

    const meds = JSON.parse(localStorage.getItem("medicines")) || [];
    meds.push({
        id: "med_" + Date.now(),
        name,
        dosage,
        time
    });
    localStorage.setItem("medicines", JSON.stringify(meds));
    displayMedicines();
    document.getElementById("medName").value   = "";
    document.getElementById("medDosage").value = "";
    document.getElementById("medTime").value   = "";
}

function displayMedicines() {
    const list = document.getElementById("medicineList");
    if (!list) return;
    list.innerHTML = "";
    const meds = JSON.parse(localStorage.getItem("medicines")) || [];
    if (!meds.length) {
        list.innerHTML = `<tr><td colspan="4">No medicines added yet</td></tr>`;
        return;
    }
    meds.forEach((med, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${med.name}</td>
            <td>${med.dosage}</td>
            <td>${formatTime(med.time)}</td>
            <td><button onclick="deleteMedicine(${index})">❌</button></td>
        `;
        list.appendChild(row);
    });
}

function deleteMedicine(index) {
    const meds = JSON.parse(localStorage.getItem("medicines")) || [];
    meds.splice(index, 1);
    localStorage.setItem("medicines", JSON.stringify(meds));
    displayMedicines();
}

function formatTime(time) {
    if (!time) return "";
    const [hour, minute] = time.split(":");
    let h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute.padStart(2,"0")} ${ampm}`;
}

// ================= REMINDERS =================
let _editingReminderId = null; // global edit tracker

function addReminder() {
    const textInput = document.getElementById("reminderText");
    const timeInput = document.getElementById("reminderTime");
    const text = textInput.value.trim();
    const time = timeInput.value;

    if (!text || !time) return alert("Enter reminder text & time!");

    const reminders = JSON.parse(localStorage.getItem("reminders")) || [];

    if (_editingReminderId) {
        const index = reminders.findIndex(r => String(r.id) === _editingReminderId);
        if (index !== -1) {
            reminders[index].text = text;
            reminders[index].time = time;
        }
        _editingReminderId = null;
    } else {
        reminders.push({
            id: "rem_" + Date.now(),
            text,
            time
        });
    }

    localStorage.setItem("reminders", JSON.stringify(reminders));
    textInput.value = "";
    timeInput.value = "";
    displayReminders();
}

function displayReminders() {
    const reminderList = document.getElementById("reminderList");
    if (!reminderList) return;

    const reminders = JSON.parse(localStorage.getItem("reminders")) || [];
    reminderList.innerHTML = "";

    if (!reminders.length) {
        reminderList.innerHTML = `<tr><td colspan="3">No reminders added yet</td></tr>`;
        return;
    }

    reminders.forEach(rem => {
        if (!rem.id) rem.id = "rem_" + Date.now() + Math.random();
        rem.id = String(rem.id);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${rem.text}</td>
            <td>${rem.time}</td>
            <td>
                <button class="edit-btn"   data-id="${rem.id}">✏️ Edit</button>
                <button class="delete-btn" data-id="${rem.id}">❌ Delete</button>
            </td>
        `;
        reminderList.appendChild(row);
    });

    // Wire buttons
    reminderList.querySelectorAll(".delete-btn").forEach(btn => {
        btn.onclick = () => deleteReminder(btn.dataset.id);
    });
    reminderList.querySelectorAll(".edit-btn").forEach(btn => {
        btn.onclick = () => editReminder(btn.dataset.id);
    });
}

function deleteReminder(id) {
    id = String(id);
    let reminders = JSON.parse(localStorage.getItem("reminders")) || [];
    reminders = reminders.filter(r => String(r.id) !== id);
    localStorage.setItem("reminders", JSON.stringify(reminders));
    displayReminders();
}

function editReminder(id) {
    id = String(id);
    const reminders = JSON.parse(localStorage.getItem("reminders")) || [];
    const rem = reminders.find(r => String(r.id) === id);
    if (!rem) return;

    document.getElementById("reminderText").value = rem.text;
    document.getElementById("reminderTime").value = rem.time;

    _editingReminderId = id;
}

// ================= ALARM / SCHEDULER =================
const triggeredReminders = new Set();

function triggerAlarm(reminder) {
    console.log("🚨 ALARM:", reminder.text, "at", reminder.time);

    window._currentReminder = reminder;
    window._alarmActive = true;

    const voiceBox = document.querySelector(".voice-box");
    if (voiceBox) voiceBox.style.display = "none";

    const modal = document.getElementById("alarmModal");
    const txt   = document.getElementById("alarmText");
    const clk   = document.getElementById("alarmClock");

    if (modal) {
        if (txt) txt.textContent = reminder.text;
        if (clk) clk.textContent = reminder.time;
        modal.style.display = "flex";
    }

    startBeepLoop();
}

function dismissAlarm() {
    console.log("🛑 Alarm dismissed");

    window._alarmActive = false;
    stopBeepLoop();

    const modal = document.getElementById("alarmModal");
    if (modal) modal.style.display = "none";

    const voiceBox = document.querySelector(".voice-box");
    if (voiceBox) voiceBox.style.display = "block";

    if (!window._currentReminder) return;

    let reminders = JSON.parse(localStorage.getItem("reminders")) || [];
    reminders = reminders.filter(r => String(r.id) !== String(window._currentReminder.id));
    localStorage.setItem("reminders", JSON.stringify(reminders));
    triggeredReminders.delete(String(window._currentReminder.id));

    if (typeof displayReminders === "function") displayReminders();
}

// ================= HEALTH RECORDS =================
function addRecord() {
    const type  = document.getElementById("recordType").value;
    const value = document.getElementById("recordValue").value;
    const unit  = document.getElementById("recordUnit").value;
    const date  = document.getElementById("recordDate").value;
    const notes = document.getElementById("recordNotes").value;
    if (!type || !value) return;
    const records = JSON.parse(localStorage.getItem("healthRecords")) || [];
    records.push({ type, value, unit, date, notes });
    localStorage.setItem("healthRecords", JSON.stringify(records));
    displayRecords();
}

function displayRecords() {
    const list = document.getElementById("recordList");
    if (!list) return;
    list.innerHTML = "";
    const records = JSON.parse(localStorage.getItem("healthRecords")) || [];
    if (!records.length) {
        list.innerHTML = `<tr><td colspan="6">No records added yet</td></tr>`;
        return;
    }
    records.forEach((record, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${record.type}</td>
            <td class="${getHealthStatus(record.type, record.value)}">${record.value}</td>
            <td>${record.unit}</td>
            <td>${formatDate(record.date)}</td>
            <td>${record.notes}</td>
            <td><button onclick="deleteRecord(${index})">Delete</button></td>
        `;
        list.appendChild(row);
    });
}

function deleteRecord(index) {
    const records = JSON.parse(localStorage.getItem("healthRecords")) || [];
    records.splice(index, 1);
    localStorage.setItem("healthRecords", JSON.stringify(records));
    displayRecords();
}

function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US",
        { day:"2-digit", month:"short", year:"numeric" });
}

function setUnit() {
    const type = document.getElementById("recordType").value;
    const unitField = document.getElementById("recordUnit");
    const units = {
        "Blood Pressure": "mmHg",
        "Temperature":    "°C",
        "Heart Rate":     "bpm",
        "Blood Sugar":    "mg/dL",
        "Allergy":        "-"
    };
    unitField.value = units[type] || "";
}

function getHealthStatus(type, value) {
    if (type === "Blood Pressure") {
        const [sys, dia] = value.split("/").map(Number);
        return (sys > 130 || dia > 85) ? "warning" : "normal";
    }
    value = parseFloat(value);
    if (type === "Temperature") return value > 37.5  ? "warning" : "normal";
    if (type === "Heart Rate")  return (value > 100 || value < 60) ? "warning" : "normal";
    if (type === "Blood Sugar") return value > 140   ? "warning" : "normal";
    return "normal";
}

// ================= EMERGENCY / CONTACTS =================
// ... keep your SOS & contact code as-is ...

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    const dropdown  = document.getElementById("languageSwitcher");
    const savedLang = localStorage.getItem("language") || "en";
    if (dropdown) {
        dropdown.value = savedLang;
        dropdown.addEventListener("change", function() {
            localStorage.setItem("language", this.value);
            applyLanguage(this.value);
        });
    }
    applyLanguage(savedLang);
    initDarkMode();
    displayMedicines();
    displayReminders();
    displayRecords();
   // displayContacts();
});