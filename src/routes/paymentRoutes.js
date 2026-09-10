const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getAllPayments,
  getMyPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus
} = require("../controllers/paymentController");

router.get("/", authMiddleware, getAllPayments);
router.get("/my", authMiddleware, getMyPayments);
router.get("/:id", authMiddleware, getPaymentById);
router.post("/", authMiddleware, createPayment);
router.put("/:id/status", authMiddleware, updatePaymentStatus);

module.exports = router;
