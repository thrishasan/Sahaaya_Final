 
 
 // ================= GLOBAL VOICE ASSISTANT =================

let recognition;
let isListening = false;
let isSpeaking = false;

// ================= CONVERSATION STATE =================
let conversationState = null;
let tempReminderText = "";
let tempReminderTime = "";
let conversationTimer;
let sosPending = false;


// ================= FORMAT TIME FOR SPEECH =================

function formatTimeForSpeech(time24) {
if (!time24) return "";
const [h, m] = time24.split(":").map(Number);
const ampm = h >= 12 ? "PM" : "AM";
const h12 = h % 12 || 12;
const mins = m === 0 ? "" : ":" + String(m).padStart(2, "0");
return `${h12}${mins} ${ampm}`;
}


// ================= LANGUAGE HELPER =================

function getLang() {
const l = localStorage.getItem("language") || "en";
return l === "hi" ? "hi-IN" : l === "ta" ? "ta-IN" : l === "te" ? "te-IN" : "en-US";
}


// ================= SPEECH =================

function speak(text, onDone) {
isSpeaking = true;
window.speechSynthesis.cancel();
setTimeout(() => {
const s = new SpeechSynthesisUtterance(text);
s.lang = getLang();
s.rate = 0.92;
s.onend = () => {
isSpeaking = false;
if (onDone) onDone();
};
window.speechSynthesis.speak(s);
}, 150);
}

// Speak then automatically restart the mic
function speakThenListen(text) {
speak(text, () => {
setTimeout(() => {
if (!isSpeaking) startListening();
}, 400);
});
}


// ================= WORD → NUMBER + AM/PM NORMALIZER =================
// THE ROOT CAUSE FIX:
// Chrome (Indian English) produces "9 p.m." or "9 p m" instead of "9 pm"
// We normalize ALL variants to plain "pm" / "am" before any regex runs

const WORD_TO_NUM = {
"twelve":"12","eleven":"11","thirteen":"13","fourteen":"14",
"fifteen":"15","sixteen":"16","seventeen":"17","eighteen":"18","nineteen":"19",
"one":"1","two":"2","three":"3","four":"4","five":"5","six":"6",
"seven":"7","eight":"8","nine":"9","ten":"10","twenty":"20",
"thirty":"30","forty":"40","fifty":"50"
};

function normalizeTimeWords(cmd) {
let r = cmd.toLowerCase();

// Step 1 — normalize p.m. / a.m. / p m / a m → pm / am
r = r.replace(/p\.m\./g, "pm");
r = r.replace(/a\.m\./g, "am");
r = r.replace(/\b(\d+)\s+p\s+m\b/g, "$1 pm");
r = r.replace(/\b(\d+)\s+a\s+m\b/g, "$1 am");

// Step 2 — spoken number words → digits (longest first to avoid partial matches)
const sorted = Object.entries(WORD_TO_NUM).sort((a, b) => b[0].length - a[0].length);
for (const [word, num] of sorted) {
r = r.replace(new RegExp("\\b" + word + "\\b", "g"), num);
}

return r;
}


// ================= TIME PARSER =================

function extractTime(raw) {
const command = normalizeTimeWords(raw);

// "in 5 minutes"
const rel = command.match(/in (\d{1,2})\s?(min|mins|minute|minutes)/);
if (rel) {
const now = new Date();
now.setMinutes(now.getMinutes() + parseInt(rel[1]));
return now.toTimeString().slice(0, 5);
}

// "8 pm", "8 30 pm", "8:30 pm", "8.30 pm"
const ap = command.match(/\b(\d{1,2})(?:[:.\s]?(\d{2}))?\s*(am|pm)\b/i);
if (ap) {
let h = parseInt(ap[1]), m = ap[2] || "00", a = ap[3].toLowerCase();
if (a === "pm" && h < 12) h += 12;
if (a === "am" && h === 12) h = 0;
return `${h.toString().padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

// "8 o'clock"
const oc = command.match(/\b(\d{1,2})\s*o'?clock\b/);
if (oc) return `${parseInt(oc[1]).toString().padStart(2,"0")}:00`;

// Fuzzy words — always last
if (command.includes("morning")) return "08:00";
if (command.includes("afternoon")) return "14:00";
if (command.includes("evening")) return "18:00";
if (command.includes("tonight") || command.includes("night")) return "21:00";
if (command.includes("noon")) return "12:00";
if (command.includes("midnight")) return "00:00";

return null;
}


// ================= REMINDER TEXT PARSER =================

function extractReminderText(command) {
// Normalize first so "at nine p.m." gets stripped cleanly
let t = normalizeTimeWords(command)
.replace(/remind me to/gi, "")
.replace(/remind me/gi, "")
.replace(/add reminder/gi, "")
.replace(/set a reminder/gi, "")
.replace(/set reminder/gi, "")
.replace(/in \d+\s?(min|mins|minute|minutes).*/gi, "")
.replace(/\bat \d{1,2}(?:[:.\s]\d{2})?\s*(am|pm)\b/gi, "")
.replace(/\b\d{1,2}(?:[:.\s]\d{2})?\s*(am|pm)\b/gi, "")
.replace(/\b(morning|afternoon|evening|night|tonight|noon|midnight)\b/gi, "")
.trim();
return t || "";
}


// ================= MEDICINE NAME PARSER =================

function extractMedicineName(command) {
let n = normalizeTimeWords(command)
.replace(/add medicine/gi, "")
.replace(/take medicine/gi, "")
.replace(/medicine/gi, "")
.replace(/tablet/gi, "")
.replace(/drug/gi, "")
.replace(/\bat \d{1,2}(?:[:.\s]\d{2})?\s*(am|pm)\b/gi, "")
.replace(/\b\d{1,2}(?:[:.\s]\d{2})?\s*(am|pm)\b/gi, "")
.replace(/\b(morning|afternoon|evening|night|tonight)\b/gi, "")
.trim();
return n || "Medicine";
}


// ================= INITIALIZATION =================

document.addEventListener("DOMContentLoaded", () => {

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) {
console.warn("Speech recognition not supported. Use Chrome or Edge.");
return;
}

recognition = new SR();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = getLang();

recognition.onresult = (event) => {
const command = event.results[0][0].transcript.toLowerCase().trim();
console.log("User said:", command);
console.log("Normalized:", normalizeTimeWords(command));
resetConversationTimeout();
handleCommand(command);
};

recognition.onerror = (e) => {
console.warn("Recognition error:", e.error);
isListening = false;
setUI(false);
if (conversationState && e.error !== "not-allowed") {
setTimeout(() => repromptConversation(), 1500);
}
};

recognition.onend = () => {
isListening = false;
setUI(false);
};

setupMicButton();
handlePendingCommands();
});


// ================= UI =================

function setUI(listening) {
const waveform = document.getElementById("waveform");
const statusText = document.getElementById("voiceStatus");
if (waveform) waveform.style.display = listening ? "block" : "none";
if (statusText) statusText.textContent = listening ? "Listening..." : "";
}

function repromptConversation() {
if (conversationState === "awaitingReminderText")
speakThenListen("What should I remind you about?");
else if (conversationState === "awaitingReminderTime")
speakThenListen("When should I remind you? Say a time like 8 PM or morning.");
}


// ================= MIC BUTTON =================

function setupMicButton() {
const btn = document.getElementById("getStartedBtn");
if (!btn) return;
btn.addEventListener("click", () => { if (!isListening) startListening(); });
}

function startListening() {
if (!recognition || isListening || isSpeaking) return;
recognition.lang = getLang(); // always sync language
try {
recognition.start();
isListening = true;
setUI(true);
} catch(e) {
console.warn("recognition.start() error:", e.message);
isListening = false;
}
}


// ================= PENDING COMMANDS =================

function handlePendingCommands() {
const pr = localStorage.getItem("pendingReminder");
if (pr && window.location.pathname.includes("reminders.html")) {
localStorage.removeItem("pendingReminder");
setTimeout(() => handleCommand(pr), 800);
}
const pm = localStorage.getItem("pendingMedicine");
if (pm && window.location.pathname.includes("medicine.html")) {
localStorage.removeItem("pendingMedicine");
setTimeout(() => handleCommand(pm), 800);
}
}


// ================= MAIN COMMAND HANDLER =================

function handleCommand(command) {

// ── SOS CONFIRMATION FLOW ──────────────
// ── SOS CONFIRMATION FLOW ──────────────

if (sosPending) {
if (command.includes("yes") || command.includes("confirm")) {
sosPending = false;
speak("Sending emergency alert");

setTimeout(() => {
// If confirmSOS exists on this page — call it directly
if (typeof window.confirmSOS === "function") {
window.confirmSOS(true);
} else {
// Not on emergency.html — redirect and auto-trigger
localStorage.setItem("triggerSOS", "true");
window.location.href = "emergency.html";
}
}, 1200); // wait for speech to finish before redirect
return;
}

if (command.includes("no") || command.includes("cancel")) {
sosPending = false;
speak("Emergency alert cancelled");
return;
}

speakThenListen("Please say yes to confirm or no to cancel");
return;
}





// ── MULTI-TURN: waiting for reminder TEXT ──────────────
if (conversationState === "awaitingReminderText") {
const spokenText = command.trim();
if (!spokenText) { speakThenListen("Sorry, didn't catch that. What should I remind you about?"); return; }
tempReminderText = spokenText;
// Already have time from step 1 (e.g. "remind me in 10 min") → save now
if (tempReminderTime) {
fillReminderForm(tempReminderText, tempReminderTime, "");
resetConversation();
return;
}
conversationState = "awaitingReminderTime";
speakThenListen(`Got it. When should I remind you to ${tempReminderText}?`);
return;
}

// ── MULTI-TURN: waiting for reminder TIME ──────────────
if (conversationState === "awaitingReminderTime") {
const time = extractTime(command);
if (time) {
fillReminderForm(tempReminderText, time, command);
resetConversation();
} else {
speakThenListen("Sorry, I could not understand the time. Please say something like 8 PM or evening.");
}
return;
}

// ── NAVIGATION ─────────────────────────────────────────
if (command.includes("open medicine") || command.includes("go to medicine")) {
speak("Opening medicine page", () => window.location.href = "medicine.html"); return;
}
if (command.includes("open reminder") || command.includes("go to reminder")) {
speak("Opening reminders page", () => window.location.href = "reminders.html"); return;
}
if (command.includes("open record") || command.includes("go to record")) {
speak("Opening health records", () => window.location.href = "records.html"); return;
}
if (command.includes("open emergency") || command.includes("go to emergency")) {
speak("Opening emergency page", () => window.location.href = "emergency.html"); return;
}

// ── SOS WITH CONFIRMATION ──────────────
// ── SOS WITH CONFIRMATION ──────────────
if (command.includes("sos") || command.includes("emergency") ||
command.includes("call for help") || command.includes("send alert")) {

sosPending = true;
speakThenListen("Do you want to send an emergency alert?");
return;
}

// ── REMINDERS ──────────────────────────────────────────
// ── REMINDERS ──────────────────────────────────────────
// ── REMINDERS ──────────────────────────────────────────

 
// ── REMINDERS ──────────────────────────────────────────

if (command.includes("remind") || command.includes("reminder")) {

    // 🔥 MULTI-REMINDER SPLIT (FIXED POSITION)
    if (command.includes(" and ")) {
        const parts = command.split(" and ");

        parts.forEach((part, i) => {
            let fixedPart = part.trim();

            // Ensure each part still has "remind"
            if (!fixedPart.includes("remind")) {
                fixedPart = "remind me to " + fixedPart;
            }

            setTimeout(() => handleCommand(fixedPart), i * 800);
        });

        return;
    }

    if (!window.location.pathname.includes("reminders.html")) {
        localStorage.setItem("pendingReminder", command);
        speak("Opening reminders page", () => window.location.href = "reminders.html");
        return;
    }

    handleLLMReminder(command);
    return;
}


// ── MEDICINES ──────────────────────────────────────────

if (
    command.includes("medicine") ||
    command.includes("tablet") ||
    command.includes("drug") ||
    command.includes("take") ||          // 👈 ADD
    command.includes("capsule") ||       // 👈 ADD
    command.includes("pill")             // 👈 ADD
) {
    if (!window.location.pathname.includes("medicine.html")) {
        localStorage.setItem("pendingMedicine", command);
        speak("Opening medicine page", () => window.location.href = "medicine.html");
        return;
    }

    handleLLMMedicine(command);
    return;
}



// ── LANGUAGE ───────────────────────────────────────────
if (command.includes("hindi")) { changeLanguage("hi"); speak("Switching to Hindi"); return; }
if (command.includes("tamil")) { changeLanguage("ta"); speak("Switching to Tamil"); return; }
if (command.includes("telugu")) { changeLanguage("te"); speak("Switching to Telugu"); return; }
if (command.includes("english")) { changeLanguage("en"); speak("Switching to English"); return; }

// ── UNKNOWN ────────────────────────────────────────────
speak("Sorry, I did not understand. Try saying open medicine, open reminders, or remind me.");



}


// ================= REMINDER FORM FILL =================

// ================= REMINDER FORM FILL (updated) =================

// ================= REMINDER FORM FILL (fixed) =================

async function fillReminderForm(text, time, originalCommand, repeat = "none") {

// Always try to fill the visible form fields too (if on reminders.html)
const textField = document.getElementById("reminderText");
const timeField = document.getElementById("reminderTime");
const repeatField = document.getElementById("repeatType");

if (textField) textField.value = text;
if (timeField) timeField.value = time;
if (repeatField) repeatField.value = repeat;

// Build the reminder object exactly as reminderAPI.js expects
const now = new Date();
const [hh, mm] = time.split(":").map(Number);
const reminderDateTime = new Date();
reminderDateTime.setHours(hh, mm, 0, 0);

// If time already passed today, schedule for tomorrow
const date = reminderDateTime < now
? new Date(now.getTime() + 86400000).toISOString().split("T")[0]
: now.toISOString().split("T")[0];

const newReminder = {
id: Date.now().toString(),
title: text,
time: time,
date: date,
repeat: repeat,
enabled: 1
};

try {
// POST directly to the reminders API — no dependency on addReminder()
const res = await fetch("http://localhost:3000/reminders", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(newReminder)
});

if (!res.ok) throw new Error("Server returned " + res.status);

console.log("✅ Reminder saved via API:", newReminder);

// Refresh the displayed list if the function exists (reminders.html)
if (typeof refreshReminders === "function") {
await refreshReminders();
}

} catch (err) {
console.error("❌ Failed to save reminder:", err.message);
speak("Sorry, I could not save the reminder. Please try again.");
return;
}

// Speak confirmation
const spokenTime = formatTimeForSpeech(time);
let fuzzyPart = "";
if (originalCommand.includes("tonight")) fuzzyPart = " tonight";
else if (originalCommand.includes("morning")) fuzzyPart = " tomorrow morning";
else if (originalCommand.includes("evening")) fuzzyPart = " this evening";
else if (originalCommand.includes("afternoon")) fuzzyPart = " this afternoon";
else if (originalCommand.includes("night")) fuzzyPart = " at night";

const responseText = `Reminder set for ${text}${fuzzyPart} at ${spokenTime}`;
isSpeaking = true;
window.speechSynthesis.cancel();
setTimeout(() => {
const s = new SpeechSynthesisUtterance(responseText);
s.lang = getLang();
s.rate = 0.92;
s.pitch = 1.05;
s.onend = () => { isSpeaking = false; };
window.speechSynthesis.speak(s);
}, 600);
}

// ================= MEDICINE VOICE =================

function addMedicineFromVoice(command) {
const nameField = document.getElementById("medName");
const dosageField = document.getElementById("medDosage");
const timeField = document.getElementById("medTime");
if (!nameField || !dosageField || !timeField) return;

const name = extractMedicineName(command);
const time = extractTime(command) || "09:00";

nameField.value = name;
dosageField.value = "1 tablet";
timeField.value = time;

if (typeof addMedicine === "function") addMedicine();

isSpeaking = true;
window.speechSynthesis.cancel();
setTimeout(() => {
const s = new SpeechSynthesisUtterance(`Medicine ${name} added at ${formatTimeForSpeech(time)}`);
s.lang = getLang();
s.rate = 0.92;
s.onend = () => { isSpeaking = false; };
window.speechSynthesis.speak(s);
}, 600);
}


// ================= CONVERSATION CONTROL =================

function resetConversation() {
conversationState = null;
tempReminderText = "";
tempReminderTime = "";
}

function resetConversationTimeout() {
clearTimeout(conversationTimer);
conversationTimer = setTimeout(() => {
if (conversationState) {
resetConversation();
speak("Conversation timed out. Tap the mic to start again.");
}
}, 15000);
}


// ================= LANGUAGE =================

function changeLanguage(lang) {
localStorage.setItem("language", lang);
const dropdown = document.getElementById("languageSwitcher");
if (dropdown) dropdown.value = lang;
if (typeof applyLanguage === "function") applyLanguage(lang);
if (recognition) recognition.lang = getLang();
}

// ================= LLM REMINDER =================
 
async function handleLLMReminder(command) {
    try {
        const res = await fetch("/api/voice-reminder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: command })
        });

        const data = await res.json();

        if (!data || !data.reminder) {
            localFallbackReminder(command);
            return;
        }

        const r = data.reminder;

        const extractedTime = extractTime(command); // 👈 KEY LINE

        // 🚨 IF USER DID NOT SAY TIME → FORCE MULTI-TURN
        if (!extractedTime) {
            tempReminderText = r.title || extractReminderText(command);
            conversationState = "awaitingReminderTime";
            speakThenListen(`When should I remind you to ${tempReminderText}?`);
            return;
        }

        // ✅ Only now allow saving
        fillReminderForm(r.title, extractedTime, command, r.repeat || "none");

    } catch (err) {
        console.error("LLM error:", err);
        localFallbackReminder(command);
    }
}


// ================= LLM MEDICINE =================
 async function handleLLMMedicine(command) {
    try {
        const res = await fetch("/api/voice-reminder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: command })
        });

        const data = await res.json();

        if (!data || !data.reminder) {
            addMedicineFromVoice(command);
            return;
        }

        const r = data.reminder;

        const name   = r.medicine_name || extractMedicineName(command);
        const dosage = r.dosage || "1 tablet";
        const time   = r.time || "09:00";

        document.getElementById("medName").value   = name;
        document.getElementById("medDosage").value = dosage;
        document.getElementById("medTime").value   = time;

        if (typeof addMedicine === "function") addMedicine();

        speak(`Medicine ${name} added at ${formatTimeForSpeech(time)}`);

    } catch (err) {
        console.error("LLM error:", err);
        addMedicineFromVoice(command);
    }
}


// ================= LOCAL FALLBACK (if LLM fails) =================
function localFallbackReminder(command) {
  const time = extractTime(command);
  const text = extractReminderText(command);

  // reset previous conversation state
  tempReminderTime = null;
  tempReminderText = "";
  conversationState = null;

  if (text && time) {
    // both present → save immediately
    fillReminderForm(text, time, command, "none");
  } else if (text && !time) {
    // text present but no time → ask user
    tempReminderText = text;
    conversationState = "awaitingReminderTime";
    speakThenListen(`When should I remind you to ${text}? Say a time like 8 PM or morning.`);
  } else if (!text && time) {
    // time present but no text → ask user
    tempReminderTime = time;
    conversationState = "awaitingReminderText";
    speakThenListen("What should I remind you about?");
  } else {
    // neither → ask for text first
    conversationState = "awaitingReminderText";
    speakThenListen("What should I remind you about?");
  }
}

