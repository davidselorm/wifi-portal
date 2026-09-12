const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getDashboardStats,
  getActiveSessions,
  kickSession
} = require("../controllers/adminController");

router.get("/dashboard", authMiddleware, getDashboardStats);
router.get("/sessions", authMiddleware, getActiveSessions);
router.post("/sessions/:id/kick", authMiddleware, kickSession);

module.exports = router;
