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

const calculateMinutes = (value, unit) => {
  const val = Number(value) || 1;
  const cleanUnit = (unit || "hours").toLowerCase();
  if (cleanUnit === "days" || cleanUnit === "day") {
    return val * 1440;
  }
  if (cleanUnit === "minutes" || cleanUnit === "min" || cleanUnit === "mins") {
    return val;
  }
  // default to hours
  return val * 60;
};

const createPackage = async (req, res) => {
  try {
    const {
      package_name,
      name,
      price,
      description,
      duration_value = 1,
      duration_unit = "hours",
      duration_minutes,
      speed_limit = "Unlimited",
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

    const finalValue = Number(duration_value) || 1;
    const finalUnit = duration_unit || "hours";
    const finalMinutes = Number(duration_minutes) || calculateMinutes(finalValue, finalUnit);

    const [result] = await pool.query(
      `INSERT INTO packages (
        package_name, price, description, duration_value, duration_unit, duration_minutes, speed_limit, data_limit_mb, validity_days, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalName,
        price,
        description || "",
        finalValue,
        finalUnit,
        finalMinutes,
        speed_limit || "Unlimited",
        Number(data_limit_mb) || 0,
        Number(validity_days) || 0,
        status
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: {
        id: result.insertId,
        package_name: finalName,
        price,
        description: description || "",
        duration_value: finalValue,
        duration_unit: finalUnit,
        duration_minutes: finalMinutes,
        speed_limit: speed_limit || "Unlimited",
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
        message: "Database unavailable. Please start your database server."
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
      duration_value,
      duration_unit,
      duration_minutes,
      speed_limit,
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

    const prev = existingPackage[0];
    const finalName = package_name || name || prev.package_name;
    const finalPrice = price ?? prev.price;
    const finalDescription = description ?? prev.description;
    const finalValue = duration_value !== undefined ? Number(duration_value) : (prev.duration_value || 1);
    const finalUnit = duration_unit || prev.duration_unit || "hours";
    const finalMinutes =
      duration_minutes !== undefined
        ? Number(duration_minutes)
        : calculateMinutes(finalValue, finalUnit);
    const finalSpeedLimit = speed_limit || prev.speed_limit || "Unlimited";
    const finalDataLimit = data_limit_mb ?? prev.data_limit_mb ?? 0;
    const finalValidity = validity_days ?? prev.validity_days ?? 0;
    const finalStatus = status ?? prev.status;

    await pool.query(
      `UPDATE packages SET 
        package_name = ?, price = ?, description = ?, duration_value = ?, duration_unit = ?, 
        duration_minutes = ?, speed_limit = ?, data_limit_mb = ?, validity_days = ?, status = ? 
       WHERE id = ?`,
      [
        finalName,
        finalPrice,
        finalDescription,
        finalValue,
        finalUnit,
        finalMinutes,
        finalSpeedLimit,
        finalDataLimit,
        finalValidity,
        finalStatus,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: {
        id,
        package_name: finalName,
        price: finalPrice,
        description: finalDescription,
        duration_value: finalValue,
        duration_unit: finalUnit,
        duration_minutes: finalMinutes,
        speed_limit: finalSpeedLimit,
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
        message: "Database unavailable. Please start your database server."
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
