const db = require("../config/db");

// Get all alerts (admin)
exports.getAllAlerts = (req, res) => {
  db.query("SELECT * FROM alerts ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

// Get alerts for one bin
exports.getAlertsByBin = (req, res) => {
  const { binId } = req.params;

  db.query(
    "SELECT * FROM alerts WHERE bin_id = ?",
    [binId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
};

// Create alert (USER)
exports.createAlert = (req, res) => {
  const { bin_id, message, description, severity } = req.body;

  if (!bin_id || !message) {
    return res.status(400).json({
      message: "bin_id and message are required"
    });
  }

  // Verify bin exists
  db.query(
    "SELECT id FROM bins WHERE id = ?",
    [bin_id],
    (errBin, bins) => {
      if (errBin) return res.status(500).json(errBin);

      if (bins.length === 0) {
        return res.status(404).json({ message: "Bin not found" });
      }

      // Create alert - using columns that exist in alerts table
      db.query(
        `INSERT INTO alerts (bin_id, alert_type, message, status, created_at)
         VALUES (?, ?, ?, 'active', NOW())`,
        [bin_id, "USER_ALERT", message],
        (errInsert) => {
          if (errInsert) {
            console.error("Alert creation error:", errInsert);
            return res.status(500).json({ error: errInsert.message });
          }
          res.json({ message: "Alert created successfully" });
        }
      );
    }
  );
};

// Get user's own alerts (USER)
exports.getMyAlerts = (req, res) => {
  db.query(
    "SELECT * FROM alerts WHERE alert_type = 'USER_ALERT' ORDER BY created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results || []);
    }
  );
};
