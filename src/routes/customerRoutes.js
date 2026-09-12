const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getCustomerDashboard,
  recordUsage,
  extendTestTime
} = require("../controllers/customerController");

router.get("/dashboard", authMiddleware, getCustomerDashboard);
router.post("/record-usage", authMiddleware, recordUsage);
router.post("/extend-test-time", authMiddleware, extendTestTime);

module.exports = router;
