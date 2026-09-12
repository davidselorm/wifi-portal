const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getCustomerDashboard,
  recordUsage,
  extendTestTime,
  syncDeviceSession,
  disconnectDeviceSession
} = require("../controllers/customerController");

router.get("/dashboard", authMiddleware, getCustomerDashboard);
router.post("/record-usage", authMiddleware, recordUsage);
router.post("/extend-test-time", authMiddleware, extendTestTime);
router.post("/session", authMiddleware, syncDeviceSession);
router.post("/session/disconnect", authMiddleware, disconnectDeviceSession);

module.exports = router;
