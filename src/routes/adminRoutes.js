const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { getDashboardStats } = require("../controllers/adminController");

router.get("/dashboard", authMiddleware, getDashboardStats);

module.exports = router;
