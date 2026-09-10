const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getCustomerDashboard,
  recordUsage
} = require("../controllers/customerController");

router.get("/dashboard", authMiddleware, getCustomerDashboard);
router.post("/record-usage", authMiddleware, recordUsage);

module.exports = router;
