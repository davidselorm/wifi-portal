const { pool } = require("../config/db");

const getAllPackages = async (req, res) => {
  try {
    const [packages] = await pool.query(
      "SELECT * FROM packages ORDER BY created_at DESC"
    );

    return res.status(200).json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (error) {
    console.error("Get packages error:", error);

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

const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query("SELECT * FROM packages WHERE id = ? LIMIT 1", [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error("Get package by id error:", error);

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

const createPackage = async (req, res) => {
  try {
    const {
      package_name,
      name,
      price,
      description,
      data_limit_mb = 0,
      validity_days = 0,
      status = "active"
    } = req.body;

    const finalName = package_name || name;

    if (!finalName || !price) {
      return res.status(400).json({
        success: false,
        message: "Package name and price are required"
      });
    }

    const [result] = await pool.query(
      "INSERT INTO packages (package_name, price, description, data_limit_mb, validity_days, status) VALUES (?, ?, ?, ?, ?, ?)",
      [finalName, price, description || "", Number(data_limit_mb) || 0, Number(validity_days) || 0, status]
    );

    return res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: {
        id: result.insertId,
        package_name: finalName,
        price,
        description: description || "",
        data_limit_mb: Number(data_limit_mb) || 0,
        validity_days: Number(validity_days) || 0,
        status
      }
    });
  } catch (error) {
    console.error("Create package error:", error);

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

const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      package_name,
      name,
      price,
      description,
      data_limit_mb,
      validity_days,
      status
    } = req.body;

    const [existingPackage] = await pool.query(
      "SELECT * FROM packages WHERE id = ? LIMIT 1",
      [id]
    );

    if (existingPackage.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    const finalName = package_name || name || existingPackage[0].package_name;
    const finalPrice = price ?? existingPackage[0].price;
    const finalDescription = description ?? existingPackage[0].description;
    const finalDataLimit = data_limit_mb ?? existingPackage[0].data_limit_mb ?? 0;
    const finalValidity = validity_days ?? existingPackage[0].validity_days ?? 0;
    const finalStatus = status ?? existingPackage[0].status;

    await pool.query(
      "UPDATE packages SET package_name = ?, price = ?, description = ?, data_limit_mb = ?, validity_days = ?, status = ? WHERE id = ?",
      [finalName, finalPrice, finalDescription, finalDataLimit, finalValidity, finalStatus, id]
    );

    return res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: {
        id,
        package_name: finalName,
        price: finalPrice,
        description: finalDescription,
        data_limit_mb: finalDataLimit,
        validity_days: finalValidity,
        status: finalStatus
      }
    });
  } catch (error) {
    console.error("Update package error:", error);

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

const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const [existingPackage] = await pool.query(
      "SELECT * FROM packages WHERE id = ? LIMIT 1",
      [id]
    );

    if (existingPackage.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    await pool.query("DELETE FROM packages WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Package deleted successfully",
      data: {
        id: Number(id)
      }
    });
  } catch (error) {
    console.error("Delete package error:", error);

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
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage
};
