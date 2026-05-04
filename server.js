// ================= server.js =================
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 3000;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});
// Security headers (safe version)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; script-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; media-src 'self'"
  );
  next();
});

// ================= ROOT TEST ROUTE =================
app.get("/", (req, res) => {
  res.send("SERVER RUNNING OK");
});

// ================= DATABASE =================
const db = new sqlite3.Database("./db.sqlite");

// reminders table (IMPORTANT — was missing in your latest version)
db.run(`
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  time TEXT,
  status TEXT DEFAULT 'pending'
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS medicines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  dosage TEXT,
  time TEXT,
  repeat TEXT,
  last_taken_date TEXT,
  enabled INTEGER DEFAULT 1
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS caretakers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  relation TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS sos_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  latitude REAL,
  longitude REAL,
  timestamp TEXT
)
`);

// ================= STATIC ROUTES =================
app.get("/medicines.html", (req, res) => {
  res.sendFile(path.join(__dirname, "medicine.html"));
});

// ================= ROUTES =================
require("./routes/remindersRoutes")(app, db);
require("./routes/medicinesRoutes")(app, db);
require("./routes/sosRoutes")(app, db);

// ================= VOICE REMINDER =================
app.post("/api/voice-reminder", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      error: "No text provided",
    });
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
    });

    const answer = response.choices[0].message.content;

    res.json({
      success: true,
      answer,
    });
  } catch (err) {
    console.error("Voice reminder error:", err.message);
    res.status(500).json({
      success: false,
      error: "LLM failed",
    });
  }
});

// ================= GENERAL LLM =================
app.post("/api/llm", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const answer = response.choices[0].message.content;

    let action = "none";
    if (answer.toLowerCase().includes("medicine")) action = "medicine";
    if (answer.toLowerCase().includes("sos")) action = "sos";

    res.json({ answer, action });
  } catch (err) {
    console.error("LLM error:", err.message);
    res.status(500).json({
      answer: "LLM failed",
      action: "none",
    });
  }
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});