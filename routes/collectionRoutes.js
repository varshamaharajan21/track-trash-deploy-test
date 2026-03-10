const express = require("express");
const router = express.Router();

const {
  assignBin,
  getAllCollections,
  getMyCollections,
  completeCollection,
  updateCollection
} = require("../controllers/collectionController");

const { verifyToken } = require("../middleware/authMiddleware");
const { isAdmin, isCollector } = require("../middleware/roleMiddleware");


/* ================================
   ADMIN ROUTES
================================ */

// Assign bin to collector
router.post("/assign", verifyToken, isAdmin, assignBin);

// View all collections
router.get("/", verifyToken, isAdmin, getAllCollections);

// Update collection (admin can edit status, reassign)
router.put("/:id", verifyToken, isAdmin, updateCollection);


/* ================================
   COLLECTOR ROUTES
================================ */

// View my pending collections
router.get("/my", verifyToken, isCollector, getMyCollections);

// Mark collection complete
router.put("/complete/:id", verifyToken, isCollector, completeCollection);


module.exports = router;
