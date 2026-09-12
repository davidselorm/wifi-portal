require("dotenv").config();
const { backupDatabase, getDatabaseStats } = require("../config/db");

async function main() {
  console.log("Starting SQLite database backup...");
  try {
    const statsBefore = getDatabaseStats();
    console.log(`Database Status: ${statsBefore.status} (Integrity: ${statsBefore.integrity})`);
    console.log(`Current DB Size: ${statsBefore.fileSizeFormatted}`);
    console.log(`Records: ${statsBefore.counts.users} users, ${statsBefore.counts.payments} payments, ${statsBefore.counts.packages} packages`);

    const result = await backupDatabase();
    console.log("-----------------------------------------");
    console.log("✓ Database backup completed successfully!");
    console.log(`Backup Location: ${result.backupPath}`);
    console.log(`Created At: ${result.createdAt}`);
    console.log("-----------------------------------------");
    process.exit(0);
  } catch (error) {
    console.error("✗ Database backup failed:", error.message);
    process.exit(1);
  }
}

main();
