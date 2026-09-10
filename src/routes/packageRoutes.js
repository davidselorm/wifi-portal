const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage
} = require("../controllers/packageController");

router.get("/", authMiddleware, getAllPackages);
router.get("/:id", authMiddleware, getPackageById);
router.post("/", authMiddleware, createPackage);
router.put("/:id", authMiddleware, updatePackage);
router.delete("/:id", authMiddleware, deletePackage);

module.exports = router;
