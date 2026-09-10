const { pool } = require("../config/db");

const getAllPayments = async (req, res) => {
  try {
    const [payments] = await pool.query(
      "SELECT * FROM payments ORDER BY created_at DESC"
    );

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error("Get all payments error:", error);

    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.message?.includes("connect")
    ) {
      return res.status(503).json({
        success: false,
        message: "Database unavailable. Please start your MySQL server."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const userId = req.user?.id;

    const [payments] = await pool.query(
      "SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error("Get my payments error:", error);

    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.message?.includes("connect")
    ) {
      return res.status(503).json({
        success: false,
        message: "Database unavailable. Please start your MySQL server."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query("SELECT * FROM payments WHERE id = ? LIMIT 1", [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error("Get payment by id error:", error);

    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.message?.includes("connect")
    ) {
      return res.status(503).json({
        success: false,
        message: "Database unavailable. Please start your MySQL server."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const createPayment = async (req, res) => {
  try {
    const {
      user_id,
      package_id,
      amount,
      payment_method,
      status = "pending",
      reference
    } = req.body;

    const finalUserId = user_id ?? req.user?.id;

    if (!finalUserId || !package_id || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: "User, package, amount, and payment method are required"
      });
    }

    const [result] = await pool.query(
      "INSERT INTO payments (user_id, package_id, amount, payment_method, status, reference) VALUES (?, ?, ?, ?, ?, ?)",
      [finalUserId, package_id, amount, payment_method, status, reference || null]
    );

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: {
        id: result.insertId,
        user_id: finalUserId,
        package_id,
        amount,
        payment_method,
        status,
        reference: reference || null
      }
    });
  } catch (error) {
    console.error("Create payment error:", error);

    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.message?.includes("connect")
    ) {
      return res.status(503).json({
        success: false,
        message: "Database unavailable. Please start your MySQL server."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Payment status is required"
      });
    }

    const [existingPayment] = await pool.query(
      "SELECT * FROM payments WHERE id = ? LIMIT 1",
      [id]
    );

    if (existingPayment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    await pool.query("UPDATE payments SET status = ? WHERE id = ?", [status, id]);

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: {
        id,
        status
      }
    });
  } catch (error) {
    console.error("Update payment status error:", error);

    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.message?.includes("connect")
    ) {
      return res.status(503).json({
        success: false,
        message: "Database unavailable. Please start your MySQL server."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  getAllPayments,
  getMyPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus
};
