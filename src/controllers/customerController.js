const { pool } = require("../config/db");

const formatDataUnit = (mb) => {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${Number(mb).toFixed(0)} MB`;
};

const getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const [userRows] = await pool.query(
      "SELECT id, full_name, email, phone, role, used_data_mb, status, created_at FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const [packageRows] = await pool.query(
      "SELECT * FROM packages WHERE status = 'active' ORDER BY price ASC"
    );

    const [paymentRows] = await pool.query(
      "SELECT p.*, pk.package_name, pk.data_limit_mb FROM payments p LEFT JOIN packages pk ON p.package_id = pk.id WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT 6",
      [userId]
    );

    const [totalSpentRows] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_spent FROM payments WHERE user_id = ? AND status = 'paid'",
      [userId]
    );

    const [paymentCountRows] = await pool.query(
      "SELECT COUNT(*) AS total_payments FROM payments WHERE user_id = ?",
      [userId]
    );

    // Calculate total data bundle volume purchased (in MB) from all paid transactions
    const [totalDataRows] = await pool.query(
      `SELECT COALESCE(SUM(pk.data_limit_mb), 0) AS total_data_mb
       FROM payments p
       JOIN packages pk ON p.package_id = pk.id
       WHERE p.user_id = ? AND p.status = 'paid'`,
      [userId]
    );

    const totalDataMb = Number(totalDataRows[0]?.total_data_mb || 0);
    const usedDataMb = Number(userRows[0]?.used_data_mb || 0);
    const remainingDataMb = Math.max(0, totalDataMb - usedDataMb);
    const percentageRemaining =
      totalDataMb > 0
        ? Math.min(100, Math.max(0, Math.round((remainingDataMb / totalDataMb) * 100)))
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        user: userRows[0],
        available_packages: packageRows,
        recent_payments: paymentRows,
        payment_summary: {
          total_payments: paymentCountRows[0]?.total_payments || 0,
          total_spent: Number(totalSpentRows[0]?.total_spent || 0)
        },
        data_balance: {
          total_mb: totalDataMb,
          used_mb: usedDataMb,
          remaining_mb: remainingDataMb,
          percentage_remaining: percentageRemaining,
          is_active: remainingDataMb > 0,
          formatted: {
            total: formatDataUnit(totalDataMb),
            used: formatDataUnit(usedDataMb),
            remaining: formatDataUnit(remainingDataMb)
          }
        }
      }
    });
  } catch (error) {
    console.error("Customer dashboard error:", error);

    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.message?.includes("connect")
    ) {
      return res.status(503).json({
        success: false,
        message: "Database unavailable."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const recordUsage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { consumed_mb = 100 } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    await pool.query(
      "UPDATE users SET used_data_mb = used_data_mb + ? WHERE id = ?",
      [Number(consumed_mb), userId]
    );

    const [userRows] = await pool.query(
      "SELECT used_data_mb FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "Data usage updated successfully",
      used_data_mb: userRows[0]?.used_data_mb || 0
    });
  } catch (error) {
    console.error("Record usage error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getCustomerDashboard,
  recordUsage
};
