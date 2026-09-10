const bcrypt = require("bcryptjs");
const { pool } = require("./config/db");

const users = [
  { full_name: "Kwame Mensah", phone: "+233241000001", email: "kwame.mensah@example.com", password: "Password123!", role: "customer", status: "active" },
  { full_name: "Abena Osei", phone: "+233551000002", email: "abena.osei@example.com", password: "Password123!", role: "customer", status: "active" },
  { full_name: "Kofi Boateng", phone: "+233201000003", email: "kofi.boateng@example.com", password: "Password123!", role: "customer", status: "active" },
  { full_name: "Ama Serwaa", phone: "+233271000004", email: "ama.serwaa@example.com", password: "Password123!", role: "customer", status: "active" },
  { full_name: "Yaw Appiah", phone: "+233241000005", email: "yaw.appiah@example.com", password: "Password123!", role: "customer", status: "active" },
  { full_name: "Akosua Antwi", phone: "+233541000006", email: "akosua.antwi@example.com", password: "Password123!", role: "customer", status: "inactive" },
  { full_name: "Kwadwo Asare", phone: "+233261000007", email: "kwadwo.asare@example.com", password: "Password123!", role: "customer", status: "active" },
  { full_name: "Admin User", phone: "+233249999999", email: "admin@wavenet.com", password: "AdminPassword123!", role: "admin", status: "active" },
];

const packages = [
  { package_name: "500 MB Mini", price: 3.00, data_limit_mb: 500, description: "500MB data. No expiry — active until finished.", validity_days: 0, status: "active" },
  { package_name: "1 GB Bundle", price: 5.00, data_limit_mb: 1024, description: "1GB high-speed data. No expiry — buy another when exhausted.", validity_days: 0, status: "active" },
  { package_name: "2.5 GB Value Pack", price: 12.00, data_limit_mb: 2560, description: "2.5GB data. Never expires until used up.", validity_days: 0, status: "active" },
  { package_name: "5 GB Mega Pack", price: 22.00, data_limit_mb: 5120, description: "5GB data for streaming, video calls and browsing.", validity_days: 0, status: "active" },
  { package_name: "10 GB Super Bundle", price: 40.00, data_limit_mb: 10240, description: "10GB heavy usage bundle with no time limit.", validity_days: 0, status: "active" },
  { package_name: "25 GB Jumbo Pack", price: 90.00, data_limit_mb: 25600, description: "25GB maximum data pack for downloads and work.", validity_days: 0, status: "active" },
];

const paymentStatuses = ["paid", "pending", "paid", "paid", "paid", "pending", "paid", "paid"];

async function seedDatabase() {
  try {
    // Clear existing records
    await pool.query("DELETE FROM payments");
    await pool.query("DELETE FROM packages");
    await pool.query("DELETE FROM users");

    const insertedUsers = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const [result] = await pool.query(
        "INSERT INTO users (full_name, phone, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)",
        [user.full_name, user.phone, user.email, hashedPassword, user.role, user.status]
      );
      insertedUsers.push({ id: result.insertId, ...user });
    }

    const insertedPackages = [];
    for (const pkg of packages) {
      const [result] = await pool.query(
        "INSERT INTO packages (package_name, price, description, data_limit_mb, validity_days, status) VALUES (?, ?, ?, ?, ?, ?)",
        [pkg.package_name, pkg.price, pkg.description, pkg.data_limit_mb, pkg.validity_days, pkg.status]
      );
      insertedPackages.push({ id: result.insertId, ...pkg });
    }

    const paymentMethods = ["MTN MoMo", "Telecel Cash", "Card", "MTN MoMo"];
    for (let i = 0; i < insertedUsers.length; i++) {
      const user = insertedUsers[i];
      const pkg = insertedPackages[i % insertedPackages.length];
      await pool.query(
        "INSERT INTO payments (user_id, package_id, amount, payment_method, status, reference) VALUES (?, ?, ?, ?, ?, ?)",
        [
          user.id,
          pkg.id,
          Number(pkg.price),
          paymentMethods[i % paymentMethods.length],
          paymentStatuses[i % paymentStatuses.length],
          `WAVE-GH-${String(i + 1).padStart(4, "0")}`
        ]
      );
    }

    const [userCount] = await pool.query("SELECT COUNT(*) AS total FROM users");
    const [packageCount] = await pool.query("SELECT COUNT(*) AS total FROM packages");
    const [paymentCount] = await pool.query("SELECT COUNT(*) AS total FROM payments");

    console.log("Ghanaian WiFi Portal SQLite database seeded successfully!");
    console.log(`- Users: ${userCount[0].total}`);
    console.log(`- Packages: ${packageCount[0].total}`);
    console.log(`- Payments: ${paymentCount[0].total}`);
  } catch (error) {
    console.error("Seed failed:", error.message);
  }
}

seedDatabase();
