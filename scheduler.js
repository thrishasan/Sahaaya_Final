 // VERSION 9 — fixes medicine modal, alarm dismiss, missed-reminder flood, retry tracking

console.log("🚀 SCHEDULER VERSION 9");

// ================= IMPORTS =================
import { getAllReminders, updateReminder } from "./reminderAPI.js";
import { refreshReminders } from "./reminders.js";
import { getAllMedicines, markMedicineTaken } from "./medicinesAPI.js";

// ================= AUDIO / DAILY RESET =================

// unlock audio context if possible
function ensureAudioUnlocked() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.warn("AudioContext creation failed:", e);
            return;
        }
    }
    if (audioCtx.state === "suspended") audioCtx.resume().then(() => {
        console.log("🔓 Audio resumed automatically");
    }).catch(e => console.warn("Audio resume failed:", e));
    audioUnlocked = true;
}

// reset triggered medicines daily
function dailyTriggeredReset() {
    const lastReset = localStorage.getItem("sahaaya_last_reset") || "";
    const today = new Date().toISOString().slice(0,10);
    if (lastReset !== today) {
        console.log("🔄 Resetting triggered medicines for a new day");
        triggeredMedicines.clear();
        saveTriggeredMedicines();
        localStorage.setItem("sahaaya_last_reset", today);
    }
}

// call on page load
document.addEventListener("DOMContentLoaded", () => {
    ensureAudioUnlocked();
    dailyTriggeredReset();
});


// ================= STATE =================
let schedulerInterval  = null;
if (!window.triggeredReminders) window.triggeredReminders = new Set();

let lastCheckedMinute  = "";
// ─── persist triggered medicines across reloads ─────────────────────────────
const MED_TRIGGER_KEY = "sahaaya_triggered_medicines";

function loadTriggeredMedicines() {
    try {
        const raw = localStorage.getItem(MED_TRIGGER_KEY);
        return raw ? new Map(JSON.parse(raw)) : new Map();
    } catch {
        return new Map();
    }
}

function saveTriggeredMedicines() {
    try {
        localStorage.setItem(
            MED_TRIGGER_KEY,
            JSON.stringify([...triggeredMedicines])
        );
    } catch {}
}

// load saved trigger timestamps
let triggeredMedicines = loadTriggeredMedicines();   // id -> last trigger timestamp (ms)
let audioCtx           = null;
let alarmInterval      = null;
let audioUnlocked      = false;

window._alarmActive     = false;
window._currentReminder = null;
window.currentMedicine  = null;

// ─── persist missed-reminder tracking across reloads ────────────────────────
const MISSED_KEY = "sahaaya_missed_reminders";
function loadMissedSet() {
    try {
        const raw = localStorage.getItem(MISSED_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
}
function saveMissedSet(set) {
    try { localStorage.setItem(MISSED_KEY, JSON.stringify([...set])); } catch {}
}
const shownMissed = loadMissedSet();   // persists across page reloads

// ================= DESKTOP NOTIFICATIONS =================
function showDesktopNotification(reminder) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
        try {
            new Notification("⏰ Reminder", {
                body: `${reminder.title} at ${reminder.time}`
            });
        } catch (err) {
            console.warn("Notification failed:", err);
        }
    }
}

// ================= AUDIO UNLOCK =================
document.addEventListener("DOMContentLoaded", () => {

document.addEventListener("click", function unlockAudio() {
    if (audioUnlocked) return;

    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.resume();
        audioUnlocked = true;
        console.log("🔓 Audio unlocked:", audioCtx.state);
    } catch(e) {
        console.warn("AudioContext failed:", e);
    }

    document.removeEventListener("click", unlockAudio);
}, { once: true });

    startReminderScheduler();

    // ── button wiring ──
    const snoozeBtn  = document.getElementById("snoozeBtn");
    const dismissBtn = document.getElementById("dismissBtn");
    const takenBtn   = document.getElementById("takenBtn");

    if (snoozeBtn)  snoozeBtn.addEventListener("click", snoozeAlarm);
    if (dismissBtn) dismissBtn.addEventListener("click", dismissAlarm);

    // FIX 1 — takenBtn now stops alarm + hides both modals + marks taken

    if (takenBtn) {
    takenBtn.addEventListener("click", async () => {
        if (!window.currentMedicine) return;

        window._alarmActive = false;
        stopBeepLoop();

        const alarmModal    = document.getElementById("alarmModal");
        const medicineModal = document.getElementById("medicineModal");
        if (alarmModal)    alarmModal.classList.remove("active");
        if (medicineModal) medicineModal.style.display = "none";

        const voiceBox = document.querySelector(".voice-box");
        if (voiceBox) voiceBox.style.display = "block";

        try {
            await markMedicineTaken(window.currentMedicine.id);
            // Persist locally too (for page refresh)
            localStorage.setItem(
                "taken-" + window.currentMedicine.id,
                new Date().toISOString().slice(0,10)
            );

            // Remove from retry tracker
triggeredMedicines.delete(window.currentMedicine.id);
saveTriggeredMedicines();   // ← ADD THIS LINE
        } catch (err) {
            console.error("markMedicineTaken failed:", err.message);
        }

        window.currentMedicine  = null;
        window._currentReminder = null;
    });
}

    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }

    console.log("📄 Scheduler v9 ready");
});

// ================= BEEP ENGINE =================
function ensureAudioContext() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch(e) { return; }
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
}

function playSingleBeep() {
    if (!audioCtx || !window._alarmActive) return;
    try {
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.value = 1000;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime  + 0.4);
    } catch(e) { console.warn("Beep error:", e); }
}

function startBeepLoop() {
    ensureAudioContext();
    if (alarmInterval) return;
    alarmInterval = setInterval(() => {
        if (window._alarmActive) playSingleBeep();
    }, 800);
}

function stopBeepLoop() {
    clearInterval(alarmInterval);
    alarmInterval = null;
}

// ================= SCHEDULER =================
function startReminderScheduler() {
    if (schedulerInterval) return;
    console.log("⏳ Scheduler started");
    schedulerInterval = setInterval(async () => {
        try { await checkAllSchedules(); }
        catch (err) { console.error("Scheduler error:", err.message); }
    }, 1000);
}

// ================= REPEAT LOGIC =================
function shouldTriggerToday(reminder) {
    if (reminder.repeat === "none")   return true;
    if (reminder.repeat === "daily")  return true;
    if (reminder.repeat === "weekly") {
        if (!reminder.date) return true;
        const [y, m, d] = reminder.date.split("-").map(Number);
        const created   = new Date(y, m - 1, d);
        const today     = new Date();
        return created.getDay() === today.getDay();
    }
    return true;
}

// ================= CORE LOOP =================
async function checkAllSchedules() {
    const now         = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    if (currentTime === lastCheckedMinute) return;
    lastCheckedMinute = currentTime;

    console.log("⏱ Checking:", currentTime);

    const reminders = await getAllReminders();
    const medicines  = await getAllMedicines();

    checkReminders(reminders, currentTime);
    checkMedicines(medicines, currentTime);
}

// ================= REMINDER LOGIC =================
function checkReminders(reminders, currentTime) {
    reminders.forEach(r => {
        if (!r.id || r.enabled !== 1) return;
        if (!r.time) return;

        // FIX 3 — missed reminders use localStorage-backed set so they don't re-alert on reload
        const missedKey = "missed-" + r.id;
        if (!shownMissed.has(missedKey)
            && r.time < currentTime
            && shouldTriggerToday(r)) {
            shownMissed.add(missedKey);
            saveMissedSet(shownMissed);
            showMissedNotification(r);
        }

        // exact time trigger
        if (!window.triggeredReminders.has(r.id)
            && r.time === currentTime
            && shouldTriggerToday(r)) {
            window.triggeredReminders.add(r.id);
            triggerAlarm(r);
        }
    });
}

// ================= MEDICINE LOGIC =================
function checkMedicines(medicines, currentTime) {
    const today = new Date().toISOString().slice(0, 10);

    medicines.forEach(m => {
        if (!m.enabled || m.enabled == 0) return;

const medTime = (m.time || "").trim().slice(0, 5);
console.log("⏰ Compare:", medTime, "vs", currentTime);        const now = new Date();
        const medDate = new Date(now);
        medDate.setHours(parseInt(medTime.slice(0,2)));
        medDate.setMinutes(parseInt(medTime.slice(3,5)));
        medDate.setSeconds(0);

        const takenTodayDB = m.last_taken_date === today;
        const takenTodayLocal = localStorage.getItem("taken-" + m.id) === today;
        const takenToday = takenTodayDB || takenTodayLocal;

        console.log(
            "🔹 Checking medicine:", m.name,
            "time:", medTime,
            "takenToday:", takenToday,
            "currentTime:", currentTime
        );

        if (takenToday) {
    triggeredMedicines.delete(m.id);
    saveTriggeredMedicines();   // ← ADD THIS LINE
    return;
}

        // Trigger if time has passed and not yet triggered today
// Trigger exactly at scheduled minute
if (!triggeredMedicines.has(m.id) && medTime.localeCompare(currentTime) === 0){    console.log("🚨 MEDICINE TRIGGER MATCH:", m.name);

    triggeredMedicines.set(m.id, Date.now());
    saveTriggeredMedicines();

    triggerMedicineAlarm(m);
    return;
}

        // Retry every 10 minutes if not taken
// Retry only if today's scheduled time has passed and not taken
if (triggeredMedicines.has(m.id)) {
    const last = triggeredMedicines.get(m.id);

    const nowDate = new Date();
    const scheduledDate = new Date(nowDate);
    scheduledDate.setHours(parseInt(medTime.slice(0,2)));
    scheduledDate.setMinutes(parseInt(medTime.slice(3,5)));
    scheduledDate.setSeconds(0);

    if (nowDate >= scheduledDate && Date.now() - last >= 10 * 60 * 1000) {
        triggeredMedicines.set(m.id, Date.now());
        saveTriggeredMedicines();
        triggerMedicineAlarm(m);
    }
}
    });
}

// ================= MEDICINE MODAL =================
function showMedicineModal(m) {
    // FIX 5 — guard against missing elements (medicine.html must have this modal)
    const modal       = document.getElementById("medicineModal");
    const nameEl      = document.getElementById("medicineName");
    const dosageEl    = document.getElementById("medicineDosage");

    if (!modal) {
        console.warn("medicineModal not found in DOM — add it to your HTML");
        return;
    }

    if (nameEl)   nameEl.textContent   = m.name;
    if (dosageEl) dosageEl.textContent = m.dosage;

    window.currentMedicine  = m;
    modal.style.display     = "flex";
}

// ================= MISSED ALERT =================
function showMissedNotification(reminder) {
    // use a non-blocking toast instead of alert() so it doesn't freeze the scheduler
    const toast = document.createElement("div");
    toast.textContent = `⚠ Missed: ${reminder.title} at ${reminder.time}`;
    Object.assign(toast.style, {
        position: "fixed", bottom: "20px", left: "50%",
        transform: "translateX(-50%)",
        background: "#e74c3c", color: "#fff",
        padding: "12px 20px", borderRadius: "8px",
        zIndex: "9999", fontSize: "14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// ================= ALARM =================
function triggerAlarm(reminder) {
    console.log("🚨 ALARM:", reminder.title, "at", reminder.time);

    window._currentReminder = reminder;
    window._alarmActive     = true;

    showDesktopNotification(reminder);

    const voiceBox = document.querySelector(".voice-box");
    if (voiceBox) voiceBox.style.display = "none";

    const modal = document.getElementById("alarmModal");
    const txt   = document.getElementById("alarmText");
    const clk   = document.getElementById("alarmClock");

    if (modal) {
        if (txt) txt.textContent = reminder.title;
        if (clk) clk.textContent = reminder.time;
        modal.classList.add("active");
    }

    startBeepLoop();
}

// ================= MEDICINE ALARM WRAPPER =================
function triggerMedicineAlarm(m) {
    triggerAlarm({
        id: "medicine-" + m.id,
        title: `💊 Take ${m.name} (${m.dosage})`,
        time: m.time,
        repeat: "daily",
        _isMedicine: true
    });

    window.currentMedicine = m;
    showMedicineModal(m);
}

// ================= DISMISS =================
async function dismissAlarm() {
    if (!window._currentReminder) return;

    const reminder = window._currentReminder;
    console.log("🛑 Alarm dismissed");

    window._alarmActive = false;
    stopBeepLoop();

    const modal = document.getElementById("alarmModal");
    if (modal) modal.classList.remove("active");

    const voiceBox = document.querySelector(".voice-box");
    if (voiceBox) voiceBox.style.display = "block";

    // Also hide medicine modal if it's open
    const medicineModal = document.getElementById("medicineModal");
    if (medicineModal) medicineModal.style.display = "none";

    // Only disable one-time reminders (not medicines)
    if (reminder.repeat === "none" && !reminder._isMedicine) {
        reminder.enabled = 0;
        try {
            await updateReminder(reminder, { skipPastCheck: true });
        } catch (err) {
            console.error("Failed to disable reminder:", err.message);
        }
    }

    window.triggeredReminders.delete(reminder.id);
    window.triggeredReminders.delete("missed-" + reminder.id);

    // refresh reminders list if available
    if (typeof refreshReminders === "function") {
        try { await refreshReminders(); } catch {}
    }

    // refresh medicines list if available
    // if (typeof loadMedicines === "function") {
    //     try { await loadMedicines(); } catch {}
    // }

    window._currentReminder = null;
    window.currentMedicine  = null;
}

// ================= SNOOZE =================
async function snoozeAlarm() {
    if (!window._currentReminder) return;

    const reminder = window._currentReminder;
    console.log("😴 Snoozing:", reminder.title);

    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const newTime = `${hh}:${mm}`;

    if (!reminder._isMedicine) {
        const updatedReminder = { ...reminder, time: newTime };
        try {
            await updateReminder(updatedReminder);
            if (typeof refreshReminders === "function") await refreshReminders();
        } catch (err) {
            console.error("Snooze failed:", err.message);
        }
        window.triggeredReminders.delete(reminder.id);
        window._currentReminder = updatedReminder;
    } else {
        // For medicines, just delay the retry tracker by 5 min
        if (window.currentMedicine) {
            triggeredMedicines.set(window.currentMedicine.id, Date.now());
        }
    }

    stopBeepLoop();
    window._alarmActive = false;

    const modal = document.getElementById("alarmModal");
    if (modal) modal.classList.remove("active");

    const medicineModal = document.getElementById("medicineModal");
    if (medicineModal) medicineModal.style.display = "none";

    const voiceBox = document.querySelector(".voice-box");
    if (voiceBox) voiceBox.style.display = "block";
}

// ================= EXPORT =================
window.startReminderScheduler = startReminderScheduler;
window.dismissAlarm = dismissAlarm;
window.snoozeAlarm = snoozeAlarm; 

