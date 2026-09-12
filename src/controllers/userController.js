const { pool } = require("../config/db");

const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, full_name, phone, email, role, access_expires_at, status, created_at FROM users ORDER BY created_at DESC"
    );

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error("Get all users error:", error);

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

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT id, full_name, phone, email, role, access_expires_at, status, created_at FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error("Get user by id error:", error);

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

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, email, status } = req.body;

    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const finalFullName = full_name ?? existingUser[0].full_name;
    const finalPhone = phone ?? existingUser[0].phone;
    const finalEmail = email ?? existingUser[0].email;
    const finalStatus = status ?? existingUser[0].status;

    await pool.query(
      "UPDATE users SET full_name = ?, phone = ?, email = ?, status = ? WHERE id = ?",
      [finalFullName, finalPhone, finalEmail, finalStatus, id]
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        id,
        full_name: finalFullName,
        phone: finalPhone,
        email: finalEmail,
        status: finalStatus
      }
    });
  } catch (error) {
    console.error("Update user error:", error);

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

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await pool.query("DELETE FROM users WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: {
        id: Number(id)
      }
    });
  } catch (error) {
    console.error("Delete user error:", error);

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
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
