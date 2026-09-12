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
  { package_name: "30 Mins Quick Surf", price: 1.50, duration_value: 30, duration_unit: "minutes", duration_minutes: 30, speed_limit: "5 Mbps", description: "30 minutes continuous internet for quick searches and chats.", status: "active" },
  { package_name: "1 Hour Pass", price: 2.50, duration_value: 1, duration_unit: "hours", duration_minutes: 60, speed_limit: "10 Mbps", description: "1 hour high-speed access. Starts upon activation.", status: "active" },
  { package_name: "3 Hours Value Pack", price: 6.00, duration_value: 3, duration_unit: "hours", duration_minutes: 180, speed_limit: "15 Mbps", description: "3 hours nonstop surfing, social media and streaming.", status: "active" },
  { package_name: "12 Hours Half-Day", price: 12.00, duration_value: 12, duration_unit: "hours", duration_minutes: 720, speed_limit: "Unlimited", description: "12 hours continuous internet access for day or night use.", status: "active" },
  { package_name: "24 Hours (1 Day Pass)", price: 18.00, duration_value: 24, duration_unit: "hours", duration_minutes: 1440, speed_limit: "Unlimited", description: "Full 24 hours unlimited access. When time is up, renew to reconnect.", status: "active" },
  { package_name: "3 Days Explorer", price: 40.00, duration_value: 3, duration_unit: "days", duration_minutes: 4320, speed_limit: "Unlimited", description: "3 full days continuous internet access.", status: "active" },
  { package_name: "7 Days (1 Week Pass)", price: 75.00, duration_value: 7, duration_unit: "days", duration_minutes: 10080, speed_limit: "Unlimited", description: "1 whole week nonstop internet for work and study.", status: "active" },
  { package_name: "30 Days (Monthly Pass)", price: 220.00, duration_value: 30, duration_unit: "days", duration_minutes: 43200, speed_limit: "Unlimited", description: "30 days monthly pass with unmetered high-speed access.", status: "active" },
];

const paymentStatuses = ["paid", "pending", "paid", "paid", "paid", "pending", "paid", "paid"];

async function seedDatabase() {
  try {
    // Clear existing records
    await pool.query("DELETE FROM payments");
    await pool.query("DELETE FROM packages");
    await pool.query("DELETE FROM users");

    const now = Date.now();
    const userExpiries = [
      new Date(now + 2 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(), // Kwame: 2h 45m left
      new Date(now + 18 * 60 * 60 * 1000).toISOString(), // Abena: 18 hours left
      new Date(now - 15 * 60 * 1000).toISOString(), // Kofi: expired 15 mins ago
      new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString(), // Ama: 5 days left
      new Date(now + 45 * 60 * 1000).toISOString(), // Yaw: 45 mins left
      null, // Akosua: no active pass
      new Date(now + 3 * 60 * 60 * 1000).toISOString(), // Kwadwo: 3 hours left
      new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString(), // Admin
    ];

    const insertedUsers = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const accessExpiresAt = userExpiries[i] || null;
      const [result] = await pool.query(
        "INSERT INTO users (full_name, phone, email, password, role, access_expires_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [user.full_name, user.phone, user.email, hashedPassword, user.role, accessExpiresAt, user.status]
      );
      insertedUsers.push({ id: result.insertId, ...user, access_expires_at: accessExpiresAt });
    }

    const insertedPackages = [];
    for (const pkg of packages) {
      const [result] = await pool.query(
        `INSERT INTO packages (
          package_name, price, description, duration_value, duration_unit, duration_minutes, speed_limit, data_limit_mb, validity_days, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pkg.package_name,
          pkg.price,
          pkg.description,
          pkg.duration_value,
          pkg.duration_unit,
          pkg.duration_minutes,
          pkg.speed_limit,
          0,
          0,
          pkg.status
        ]
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

    console.log("Ghanaian WiFi Portal SQLite database seeded with Time-Based Passes successfully!");
    console.log(`- Users: ${userCount[0].total}`);
    console.log(`- Time Packages: ${packageCount[0].total}`);
    console.log(`- Payments: ${paymentCount[0].total}`);
  } catch (error) {
    console.error("Seed failed:", error.message);
  }
}

seedDatabase();
