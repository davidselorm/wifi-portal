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

    const totalUsers = usersResult[0]?.total_users || 0;
    const totalPackages = packagesResult[0]?.total_packages || 0;
    const activePackages = activePackagesResult[0]?.active_packages || 0;
    const totalRevenue = Number(revenueResult[0]?.total_revenue || 0);
    const totalPayments = Number(revenueResult[0]?.total_payments || 0);
    const activeUsers = Number(activeUsersResult[0]?.active_users || 0);

    return res.status(200).json({
      success: true,
      data: {
        total_users: totalUsers,
        total_packages: totalPackages,
        active_packages: activePackages,
        inactive_packages: totalPackages - activePackages,
        total_revenue: totalRevenue,
        total_payments: totalPayments,
        active_users: activeUsers
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
  getDashboardStats
};
