// llmParser.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function parseReminderCommand(commandText) {
  const prompt = `
You are a smart assistant. Convert user commands into structured JSON.

RULES:
- Only return valid JSON. No extra text.
- Detect intent: add_reminder OR add_medicine
- Convert natural language time to 24-hour format (HH:MM)
- If unclear time → return null

REMINDER FORMAT:
{
  "intent": "add_reminder",
  "title": "Call mom",
  "time": "18:00",
  "repeat": "none"
}

MEDICINE FORMAT:
{
  "intent": "add_medicine",
  "medicine_name": "Vitamin C",
  "dosage": "2 tablets",
  "time": "08:30",
  "repeat": "daily"
}

User command: "${commandText}"
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const text = response.choices[0].message.content.trim();

    return JSON.parse(text);

  } catch (err) {
    console.error("❌ LLM Parsing Error:", err);
    return null;
  }
}