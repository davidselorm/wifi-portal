const { pool } = require("../config/db");

const formatDataUnit = (mb) => {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${Number(mb).toFixed(0)} MB`;
};

const formatDuration = (seconds) => {
  if (seconds <= 0) return "Expired / No Time";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
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
      "SELECT id, full_name, email, phone, role, used_data_mb, access_expires_at, status, created_at FROM users WHERE id = ? LIMIT 1",
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
      `SELECT p.*, pk.package_name, pk.duration_value, pk.duration_unit, pk.duration_minutes, pk.speed_limit, pk.data_limit_mb 
       FROM payments p 
       LEFT JOIN packages pk ON p.package_id = pk.id 
       WHERE p.user_id = ? 
       ORDER BY p.created_at DESC LIMIT 6`,
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

    // Calculate time remaining based on access_expires_at
    const now = new Date();
    const expiresAt = userRows[0]?.access_expires_at
      ? new Date(userRows[0].access_expires_at)
      : null;
    const secondsRemaining =
      expiresAt && expiresAt.getTime() > now.getTime()
        ? Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
        : 0;
    const isActive = secondsRemaining > 0;

    // Fetch most recent paid package for active pass context
    const [recentActivePlanRows] = await pool.query(
      `SELECT p.*, pk.package_name, pk.duration_value, pk.duration_unit, pk.duration_minutes, pk.speed_limit
       FROM payments p
       JOIN packages pk ON p.package_id = pk.id
       WHERE p.user_id = ? AND p.status = 'paid'
       ORDER BY p.created_at DESC LIMIT 1`,
      [userId]
    );

    const activePackage = isActive ? recentActivePlanRows[0] || null : null;

    // Legacy volume data calculation
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

    return res.status(200).json({
      success: true,
      data: {
        user: userRows[0],
        available_packages: packageRows,
        recent_payments: paymentRows,
        active_package: activePackage,
        payment_summary: {
          total_payments: paymentCountRows[0]?.total_payments || 0,
          total_spent: Number(totalSpentRows[0]?.total_spent || 0)
        },
        time_balance: {
          is_active: isActive,
          seconds_remaining: secondsRemaining,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          formatted: {
            remaining: formatDuration(secondsRemaining),
            expires_at_readable: expiresAt
              ? expiresAt.toLocaleDateString("en-GH", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              : "No Active Pass",
            status_text: isActive ? "Active" : "Expired"
          }
        },
        data_balance: {
          total_mb: totalDataMb,
          used_mb: usedDataMb,
          remaining_mb: remainingDataMb,
          is_active: isActive || remainingDataMb > 0,
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

const extendTestTime = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { minutes = 60 } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const [userRows] = await pool.query(
      "SELECT access_expires_at FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    const now = new Date();
    const currentExpiry = userRows[0]?.access_expires_at
      ? new Date(userRows[0].access_expires_at)
      : null;
    const base =
      currentExpiry && currentExpiry.getTime() > now.getTime()
        ? currentExpiry.getTime()
        : now.getTime();
    const newExpiry = new Date(base + Number(minutes) * 60 * 1000).toISOString();

    await pool.query(
      "UPDATE users SET access_expires_at = ?, status = 'active' WHERE id = ?",
      [newExpiry, userId]
    );

    return res.status(200).json({
      success: true,
      message: `Added ${minutes} minutes of test access`,
      access_expires_at: newExpiry
    });
  } catch (error) {
    console.error("Extend test time error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getCustomerDashboard,
  recordUsage,
  extendTestTime
};
