const { pool } = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    const [usersResult] = await pool.query("SELECT COUNT(*) AS total_users FROM users");
    const [packagesResult] = await pool.query("SELECT COUNT(*) AS total_packages FROM packages");
    const [activePackagesResult] = await pool.query(
      "SELECT COUNT(*) AS active_packages FROM packages WHERE status = 'active'"
    );
    const [revenueResult] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_revenue, COUNT(*) AS total_payments FROM payments WHERE status = 'paid'"
    );
    const [activeUsersResult] = await pool.query(
      "SELECT COUNT(*) AS active_users FROM users WHERE access_expires_at > datetime('now')"
    );
    const [activeSessionsResult] = await pool.query(
      "SELECT COUNT(*) AS active_devices FROM active_sessions WHERE status = 'active'"
    );

    const totalUsers = usersResult[0]?.total_users || 0;
    const totalPackages = packagesResult[0]?.total_packages || 0;
    const activePackages = activePackagesResult[0]?.active_packages || 0;
    const totalRevenue = Number(revenueResult[0]?.total_revenue || 0);
    const totalPayments = Number(revenueResult[0]?.total_payments || 0);
    const activeUsers = Number(activeUsersResult[0]?.active_users || 0);
    const activeDevices = Number(activeSessionsResult[0]?.active_devices || 0);

    return res.status(200).json({
      success: true,
      data: {
        total_users: totalUsers,
        total_packages: totalPackages,
        active_packages: activePackages,
        inactive_packages: totalPackages - activePackages,
        total_revenue: totalRevenue,
        total_payments: totalPayments,
        active_users: activeUsers,
        active_devices: activeDevices
      }
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);

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

const getActiveSessions = async (req, res) => {
  try {
    const { status = "active" } = req.query;
    let query = `
      SELECT s.*, u.full_name, u.phone, u.email, u.access_expires_at as user_access_expires_at
      FROM active_sessions s
      JOIN users u ON s.user_id = u.id
    `;
    const params = [];

    if (status && status !== "all") {
      query += " WHERE s.status = ?";
      params.push(status);
    }

    query += " ORDER BY s.started_at DESC LIMIT 100";

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("getActiveSessions error:", error);
    return res.status(500).json({ success: false, message: "Failed to load active sessions" });
  }
};

const kickSession = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      "UPDATE active_sessions SET status = 'disconnected', ended_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Device session disconnected successfully"
    });
  } catch (error) {
    console.error("kickSession error:", error);
    return res.status(500).json({ success: false, message: "Failed to kick session" });
  }
};

module.exports = {
  getDashboardStats,
  getActiveSessions,
  kickSession
};
