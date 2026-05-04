// voiceRoutes.js
import express from "express";
import { parseReminderCommand } from "../llmParser.js";

const router = express.Router();

// ── ONLY parses the voice command and returns structured data ──
// The frontend (voiceAssistant.js → fillReminderForm → addReminder) handles saving.
// This route must NOT call addReminder() — that would double-save.

router.post("/voice-reminder", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    try {
        const reminder = await parseReminderCommand(text);

        // If LLM couldn't parse a valid title+time, tell frontend to use local parser
        if (!reminder || !reminder.title || !reminder.time) {
            return res.json({ success: false, reminder: null });
        }

        // Return parsed data ONLY — frontend will save it
        return res.json({ success: true, reminder });

    } catch (err) {
        console.error("LLM parse error:", err.message);
        return res.json({ success: false, reminder: null });
    }
});

export default router;
