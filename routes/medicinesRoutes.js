module.exports = (app, db) => {

  // ================= GET ALL MEDICINES =================
  app.get("/api/medicines", (req, res) => {
    db.all("SELECT * FROM medicines", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // ================= ADD MEDICINE =================

  app.post("/api/medicines", (req, res) => {
  const { name, dosage, time, repeat, enabled } = req.body;

  db.run(
    `INSERT INTO medicines (name, dosage, time, repeat, enabled)
     VALUES (?, ?, ?, ?, ?)`,
    [name, dosage, time, repeat, enabled],
    function (err) {
      if (err) {
        console.error("Insert failed:", err);
        return res.status(500).json({ error: err.message });
      }

      const insertedId = this.lastID;

      db.get(
        "SELECT * FROM medicines WHERE id = ?",
        [insertedId],
        (err, row) => {
          if (err) {
            console.error("Fetch after insert failed:", err);
            return res.status(500).json({ error: err.message });
          }

          // 🟢 Always send JSON
          if (!row) {
            return res.json({
              id: insertedId,
              name,
              dosage,
              time,
              repeat,
              enabled,
              last_taken_date: null
            });
          }

          res.json(row);
        }
      );
    }
  );
});
  


  // ================= DELETE MEDICINE =================
  app.delete("/api/medicines/:id", (req, res) => {
    db.run(
      "DELETE FROM medicines WHERE id = ?",
      [req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  // ================= MARK MEDICINE TAKEN =================
  app.patch("/api/medicines/:id/taken", (req, res) => {
    const today = new Date().toISOString().slice(0, 10);

    db.run(
      "UPDATE medicines SET last_taken_date = ? WHERE id = ?",
      [today, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

};