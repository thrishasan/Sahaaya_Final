


module.exports = function(app, db) {

    // ================= GET ALL REMINDERS =================
    app.get("/reminders", (req, res) => {
        db.all("SELECT * FROM reminders", [], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Database error" });
            }
            res.json(rows);
        });
    });

    // ================= ADD REMINDER =================
    app.post("/reminders", (req, res) => {
        const r = req.body;

        db.run(
            `INSERT INTO reminders (id, title, time, date, repeat, enabled)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [r.id, r.title, r.time, r.date, r.repeat, r.enabled],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Insert failed" });
                }
                res.json({ status: "ok" });
            }
        );
    });

    // ================= UPDATE REMINDER =================
    app.put("/reminders/:id", (req, res) => {
        const r = req.body;

        db.run(
            `UPDATE reminders
             SET title=?, time=?, date=?, repeat=?, enabled=?
             WHERE id=?`,
            [r.title, r.time, r.date, r.repeat, r.enabled, req.params.id],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Update failed" });
                }
                res.json({ status: "updated" });
            }
        );
    });

    // ================= DELETE REMINDER =================
    app.delete("/reminders/:id", (req, res) => {
        db.run(
            `DELETE FROM reminders WHERE id=?`,
            [req.params.id],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Delete failed" });
                }
                res.json({ status: "deleted" });
            }
        );
    });

};