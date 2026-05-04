// ================= REMINDER API =================
const API = "http://localhost:3000/reminders";

// ========== HELPER FUNCTIONS ==========
function validateReminder(reminder) {
    if (!reminder.title || reminder.title.trim() === "") {
        throw new Error("Reminder text cannot be empty.");
    }

    const now = new Date();
    const [hh, mm] = reminder.time.split(":").map(Number);
    const reminderDate = new Date();
    reminderDate.setHours(hh, mm, 0, 0);

    if (reminderDate < now) {
        throw new Error("Cannot set a reminder in the past.");
    }
}

async function apiFetch(url, options = {}) {
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Server error");
        }
        return await res.json().catch(() => ({}));
    } catch (err) {
        console.error("API error:", err.message);
        throw err;
    }
}

// ========== API FUNCTIONS ==========

// GET ALL
export async function getAllReminders() {
    return apiFetch(API);
}

// ADD
export async function addReminder(reminder) {
    validateReminder(reminder);
    return apiFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reminder),
    });
}

// UPDATE
export async function updateReminder(reminder, options = {}) {
    if (!reminder.id) throw new Error("Reminder ID is required for update.");

    // Only validate if skipPastCheck is NOT set
    if (!options.skipPastCheck) {
        validateReminder(reminder);
    }

    return apiFetch(`${API}/${reminder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reminder),
    });
}

// DELETE
export async function deleteReminder(id) {
    if (!id) throw new Error("Reminder ID is required for deletion.");
    return apiFetch(`${API}/${id}`, { method: "DELETE" });
}