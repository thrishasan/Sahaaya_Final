import {
    getAllReminders,
    addReminder,
    updateReminder,
    deleteReminder
} from "./reminderAPI.js";

console.log("reminders.js loaded - DB version");

// ================= GLOBAL TRIGGERED REMINDERS =================
if (!window.triggeredReminders) window.triggeredReminders = new Set();

// ================= LOAD REMINDERS =================
document.addEventListener("DOMContentLoaded", async () => {
    await refreshReminders();

    // Attach add button
    const btn = document.getElementById("addReminderBtn");
    if (btn) {
        btn.addEventListener("click", async () => {
            const text = document.getElementById("reminderText").value.trim();
            const time = document.getElementById("reminderTime").value;

            if (!text) return alert("❌ Reminder text cannot be empty.");
            if (!time) return alert("❌ Please select a time.");

            const now = new Date();
            const [hh, mm] = time.split(":").map(Number);
            const reminderDateTime = new Date();
            reminderDateTime.setHours(hh, mm, 0, 0);

            if (reminderDateTime < now) {
                return alert("❌ Cannot set reminder in the past.");
            }

            const repeat = document.getElementById("repeatType").value;
            const today = now.toISOString().split("T")[0];

            const newReminder = {
                id: Date.now().toString(),
                title: text,
                time: time,
                date: today,
                repeat: repeat,
                enabled: 1
            };

            try {
                await addReminder(newReminder);
                document.getElementById("reminderText").value = "";
                document.getElementById("reminderTime").value = "";
                await refreshReminders();
            } catch (err) {
                console.error("Failed to add reminder:", err.message);
                alert("❌ Could not add reminder. Try again.");
            }
        });
    }
});

// ================= REFRESH =================
async function refreshReminders() {
    try {
        const reminders = await getAllReminders();
        renderActiveReminders(reminders.filter(r => r.enabled === 1));
        renderHistoryReminders(reminders.filter(r => r.enabled === 0));
    } catch (err) {
        console.error("Failed to fetch reminders:", err.message);
        alert("❌ Could not load reminders. Please try again.");
    }
}

// ================= RENDER ACTIVE =================
function renderActiveReminders(reminders) {
    const list = document.getElementById("reminderList");
    if (!list) return;
    list.innerHTML = "";

    if (reminders.length === 0) {
        list.innerHTML = `<tr><td colspan="3">No active reminders</td></tr>`;
        return;
    }

    reminders.forEach(r => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${r.title}</td>
            <td>${r.time} (${r.repeat})</td>
            <td>
                <button onclick="editReminderHandler('${r.id}', '${r.title}', '${r.time}')">Edit</button>
                <button onclick="disableReminderHandler('${r.id}')">Disable</button>
             </td>
        `;
        list.appendChild(row);
    });
}

// ================= RENDER HISTORY =================
function renderHistoryReminders(reminders) {
    const historyTable = document.getElementById("historyList");
    if (!historyTable) return;

    historyTable.innerHTML = "";
    if (reminders.length === 0) {
        historyTable.innerHTML = `<tr><td colspan="3">No history yet</td></tr>`;
        return;
    }

    reminders.forEach(r => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${r.title}</td>
            <td>${r.time} (${r.repeat})</td>
            <td>
                <button onclick="reenableReminderHandler('${r.id}')">Re-enable</button>
                <button onclick="deleteReminderHandler('${r.id}')" class="delete-btn">❌</button>
            </td>
        `;
        row.classList.add("fade-in");
        historyTable.appendChild(row);
    });
}

// ================= DISABLE / RE-ENABLE =================
// ================= DISABLE / RE-ENABLE =================
window.disableReminderHandler = async function(id) {
    try {
        const reminders = await getAllReminders();
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;

        reminder.enabled = 0;
        console.log("Disabling reminder:", reminder);

        await updateReminder(reminder, { skipPastCheck: true });

        window.triggeredReminders.delete(reminder.id);

        await refreshReminders();
    } catch (err) {
        console.error("Failed to disable reminder:", err, id);
        alert("❌ Could not disable reminder.");
    }
};

window.reenableReminderHandler = async function(id) {
    try {
        const reminders = await getAllReminders();
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;

        reminder.enabled = 1;
        console.log("Re-enabling reminder:", reminder);

        // ✅ Skip past-time validation when re-enabling
        await updateReminder(reminder, { skipPastCheck: true });

        window.triggeredReminders.delete(reminder.id);

        await refreshReminders();
    } catch (err) {
        console.error("Failed to re-enable reminder:", err, id);
        alert("❌ Could not re-enable reminder.");
    }
};

// ================= EDIT =================
window.editReminderHandler = async function(id, oldTitle, oldTime) {
    const newTitle = prompt("Edit reminder text:", oldTitle);
    if (!newTitle) return alert("❌ Reminder text cannot be empty.");

    const newTime = prompt("Edit reminder time (HH:MM):", oldTime);
    if (!newTime) return alert("❌ Time cannot be empty.");

    const now = new Date();
    const [hh, mm] = newTime.split(":").map(Number);
    const reminderDateTime = new Date();
    reminderDateTime.setHours(hh, mm, 0, 0);

    if (reminderDateTime < now) {
        return alert("❌ Cannot set reminder in the past.");
    }

    try {
        const reminders = await getAllReminders();
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;

        reminder.title = newTitle;
        reminder.time  = newTime;
        await updateReminder(reminder);

        // Remove from scheduler set
        window.triggeredReminders.delete(reminder.id);

        await refreshReminders();
    } catch (err) {
        console.error("Failed to edit reminder:", err.message);
        alert("❌ Could not update reminder.");
    }
};

// ================= DELETE =================
window.deleteReminderHandler = async function(id) {
    const confirmDelete = confirm("Are you sure you want to permanently delete this reminder? ❌");
    if (!confirmDelete) return;

    try {
        await deleteReminder(id);
        window.triggeredReminders.delete(id);
        await refreshReminders();
    } catch (err) {
        console.error("Failed to delete reminder:", err.message);
        alert("❌ Could not delete reminder. Try again.");
    }
};

export { refreshReminders };