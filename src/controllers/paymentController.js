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

const grantUserAccessTime = async (userId, packageId) => {
  try {
    const [pkgRows] = await pool.query(
      "SELECT duration_minutes, duration_value, duration_unit FROM packages WHERE id = ? LIMIT 1",
      [packageId]
    );
    if (pkgRows.length === 0) return;

    const pkg = pkgRows[0];
    let minutesToAdd = Number(pkg.duration_minutes);
    if (!minutesToAdd || minutesToAdd <= 0) {
      const val = Number(pkg.duration_value) || 1;
      const unit = (pkg.duration_unit || "hours").toLowerCase();
      minutesToAdd = unit === "days" ? val * 1440 : unit === "minutes" ? val : val * 60;
    }

    const [userRows] = await pool.query(
      "SELECT access_expires_at FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (userRows.length === 0) return;

    const currentExpiresAt = userRows[0].access_expires_at
      ? new Date(userRows[0].access_expires_at)
      : null;
    const now = new Date();

    // If user currently has active time, extend from current expiry date; otherwise start from now
    const baseTime =
      currentExpiresAt && currentExpiresAt.getTime() > now.getTime()
        ? currentExpiresAt.getTime()
        : now.getTime();

    const newExpiresAt = new Date(baseTime + minutesToAdd * 60 * 1000);
    const formattedExpiry = newExpiresAt.toISOString();

    await pool.query(
      "UPDATE users SET access_expires_at = ?, status = 'active' WHERE id = ?",
      [formattedExpiry, userId]
    );
  } catch (err) {
    console.error("Error granting user access time:", err);
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

    // If payment is paid, activate or extend internet access time for user
    if (status === "paid") {
      await grantUserAccessTime(finalUserId, package_id);
    }

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

    if (status === "paid") {
      await grantUserAccessTime(existingPayment[0].user_id, existingPayment[0].package_id);
    }

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
