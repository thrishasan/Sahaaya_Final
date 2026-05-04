// ================= VOICE ASSISTANT =================

// before making global mic n all 


document.addEventListener("DOMContentLoaded", () => {

    const voiceBtn = document.getElementById("getStartedBtn");
    const statusText = document.getElementById("voiceStatus");
    const indicator = document.getElementById("listeningIndicator");

    if (!voiceBtn) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Voice recognition not supported in this browser");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;

    // Handle pending reminder after page load
const pendingReminder = localStorage.getItem("pendingReminder");
if (pendingReminder && window.location.pathname.includes("reminders.html")) {
    localStorage.removeItem("pendingReminder");
    setTimeout(() => {
        handleCommand(pendingReminder);
    }, 500);
}

// Handle pending medicine after page load
const pendingMedicine = localStorage.getItem("pendingMedicine");
if (pendingMedicine && window.location.href.includes("medicine.html")) {
    localStorage.removeItem("pendingMedicine");
    setTimeout(() => {
        handleCommand(pendingMedicine);
    }, 500);
}

    // 🎤 START LISTENING
    voiceBtn.addEventListener("click", () => {
        recognition.start();
        statusText.textContent = "Listening...";
        indicator.style.display = "block";
    });

    // 🛑 STOP
    recognition.onend = () => {
        indicator.style.display = "none";
        statusText.textContent = "";
    };

    // 🎯 RESULT
    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        console.log("User said:", command);
        handleCommand(command);
    };

});


// ================= COMMAND HANDLER =================

function handleCommand(command) {

    // ---------- NAVIGATION ----------
    if (command.includes("open medicine")) {
        window.location.href = "medicine.html";
        speak("Opening medicine management");
    }

    else if (command.includes("open reminder")) {
        window.location.href = "reminders.html";
        speak("Opening reminders");
    }

    else if (command.includes("open record")) {
        window.location.href = "records.html";
        speak("Opening health records");
    }

    else if (command.includes("open emergency")) {
        window.location.href = "emergency.html";
        speak("Opening emergency page");
    }

    // ---------- SOS ----------
    else if (command.includes("sos") || command.includes("help")) {
        speak("Sending emergency alert");
        confirmSOS();
    }

    // ---------- ADD REMINDER ----------
else if (
    command.includes("reminder") ||
    command.includes("remind me") ||
    command.includes("set reminder") ||
    command.includes("set alarm")
) {
   
// Extract time
const timeMatch = command.match(/(\d{1,2})(?:[:.](\d{2}))?\s?(am|pm)?/);

if (!timeMatch) {
speak("Please say a valid time");
return;
}

let hour = parseInt(timeMatch[1]);
let minute = timeMatch[2] || "00";
let ampm = timeMatch[3];

if (ampm === "pm" && hour < 12) hour += 12;
if (ampm === "am" && hour === 12) hour = 0;

const time = `${hour.toString().padStart(2, "0")}:${minute}`;

// Extract reminder text between 'to' and 'at'
let text = "Reminder";
const textMatch = command.match(/(?:remind me to|add reminder to|set alarm to)\s(.+?)\s(?:at|@)/);

if (textMatch && textMatch[1]) {
text = textMatch[1];
}

const reminders = JSON.parse(localStorage.getItem("reminders")) || [];
reminders.push({ text, time });
localStorage.setItem("reminders", JSON.stringify(reminders));

speak(`Reminder added for ${text}`);

if (!window.location.pathname.includes("reminders.html")) {
window.location.href = "reminders.html";
}
}

    // ---------- ADD MEDICINE ----------
else if (
    command.includes("medicine") ||
    command.includes("tablet") ||
    command.includes("pill") ||
    command.includes("dose")
){
    const words = command.split(" ");
    let name = "Medicine";
    const medIndex = words.indexOf("medicine");
    const tabIndex = words.indexOf("tablet");

    if (medIndex !== -1 && words[medIndex + 1]) {
        name = words[medIndex + 1];
    } else if (tabIndex !== -1 && words[tabIndex + 1]) {
        name = words[tabIndex + 1];
    }

    const timeMatch = command.match(/(\d{1,2})(?:[:.](\d{2}))?\s?(am|pm)?/);
    let time = "09:00";

    if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        let minute = timeMatch[2] || "00";
        let ampm = timeMatch[3];

        if (ampm === "pm" && hour < 12) hour += 12;
        if (ampm === "am" && hour === 12) hour = 0;

        time = `${hour.toString().padStart(2, "0")}:${minute}`;
    }

    const medicines = JSON.parse(localStorage.getItem("medicines")) || [];
    medicines.push({
        name: name,
        dosage: "1",
        time: time
    });
    localStorage.setItem("medicines", JSON.stringify(medicines));

    speak(`Medicine ${name} added`);

    if (!window.location.pathname.includes("medicine.html")) {
        window.location.href = "medicine.html";
    }
}

    // ---------- LANGUAGE SWITCH ----------
    else if (command.includes("hindi")) {
        changeLanguage("hi");
        speak("Switching to Hindi");
    }

    else if (command.includes("tamil")) {
        changeLanguage("ta");
        speak("Switching to Tamil");
    }

    else if (command.includes("telugu")) {
        changeLanguage("te");
        speak("Switching to Telugu");
    }

    else if (command.includes("english")) {
        changeLanguage("en");
        speak("Switching to English");
    }

    // ---------- FALLBACK ----------
    else {
        speak("Sorry, I did not understand");
    }
}


// ================= SPEECH =================

function speak(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
}


// ================= LANGUAGE CHANGE =================

function changeLanguage(lang) {
    localStorage.setItem("language", lang);
    document.getElementById("languageSwitcher").value = lang;
    applyLanguage(lang);
}