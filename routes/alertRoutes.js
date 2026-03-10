const express = require("express");
const router = express.Router();

const { 
  getAllAlerts, 
  getAlertsByBin,
  createAlert,
  getMyAlerts
} = require("../controllers/alertController");

const { verifyToken } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");

// User: create alert
router.post("/", verifyToken, createAlert);

// User: get own alerts
router.get("/my", verifyToken, getMyAlerts);

// Admin: all alerts
router.get("/", verifyToken, isAdmin, getAllAlerts);

// Admin: alerts for a specific bin
router.get("/bin/:binId", verifyToken, isAdmin, getAlertsByBin);

module.exports = router;
