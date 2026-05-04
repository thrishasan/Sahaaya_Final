// routes/sosRoutes.js
module.exports = (app, db) => {

  // ================= CARETAKERS =================

  // Add caretaker
  app.post('/api/caretakers', (req, res) => {
    const { userId, name, phone, relation } = req.body;

    if (!name || !phone)
      return res.status(400).json({ message: 'Name and phone required' });

    const stmt = db.prepare(`
      INSERT INTO caretakers (userId, name, phone, relation)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(userId || 'default', name, phone, relation || '', function(err) {
      if (err) return res.status(500).json({ message: err.message });

      res.json({ id: this.lastID, name, phone, relation });
    });
  });

  // Get caretakers
  app.get('/api/caretakers/:userId', (req, res) => {
    const userId = req.params.userId || 'default';

    db.all(
      'SELECT * FROM caretakers WHERE userId = ?',
      [userId],
      (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
      }
    );
  });

  // Delete caretaker
  app.delete('/api/caretakers/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM caretakers WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ message: err.message });

      if (this.changes === 0)
        return res.status(404).json({ message: 'Caretaker not found' });

      res.json({ message: 'Caretaker deleted' });
    });
  });

  // ================= SOS EVENTS =================

  // Log SOS event
  app.post('/api/sos', (req, res) => {
    const { userId, latitude, longitude } = req.body;

    if (!latitude || !longitude)
      return res.status(400).json({ message: "Location required" });

    const timestamp = new Date().toISOString();

    db.run(
      `INSERT INTO sos_events (userId, latitude, longitude, timestamp)
       VALUES (?, ?, ?, ?)`,
      [userId || "default", latitude, longitude, timestamp],
      function(err) {
        if (err) return res.status(500).json({ message: err.message });

        res.json({ message: "SOS logged", id: this.lastID });
      }
    );
  });

  // Fetch SOS history
  app.get('/api/sos/:userId', (req, res) => {
    const userId = req.params.userId || "default";

    db.all(
      `SELECT * FROM sos_events
       WHERE userId = ?
       ORDER BY timestamp DESC`,
      [userId],
      (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
      }
    );
  });

};