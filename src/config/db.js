const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.resolve(__dirname, "../../wifi_portal.sqlite");
const sqlite = new Database(dbPath);

// Enable WAL mode and production resilience pragmas
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");      // Wait up to 5s on concurrent write locks instead of failing
sqlite.pragma("synchronous = NORMAL");      // Maximum speed with full WAL crash safety
sqlite.pragma("cache_size = -20000");       // 20MB in-memory cache for ultra-fast reads

// Automatically ensure core tables exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    used_data_mb REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    duration_value INTEGER DEFAULT 1,
    duration_unit TEXT DEFAULT 'hours',
    duration_minutes INTEGER DEFAULT 60,
    speed_limit TEXT DEFAULT 'Unlimited',
    data_limit_mb INTEGER DEFAULT 0,
    validity_days INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
  );

  -- Cash / Offline Vouchers table for counter sales
  CREATE TABLE IF NOT EXISTS vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    package_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'unused', -- 'unused', 'used', 'cancelled'
    created_by INTEGER,
    used_by INTEGER,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
  );

  -- Active MikroTik device sessions table
  CREATE TABLE IF NOT EXISTS active_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ip_address TEXT,
    mac_address TEXT,
    uptime_seconds INTEGER DEFAULT 0,
    bytes_in INTEGER DEFAULT 0,
    bytes_out INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- 'active', 'disconnected', 'expired'
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    ended_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Production query optimization indexes
  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_access_expires ON users(access_expires_at);
  CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
  CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON active_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_mac ON active_sessions(mac_address);
`);

try {
  sqlite.exec("ALTER TABLE packages ADD COLUMN duration_value INTEGER DEFAULT 1;");
} catch {
  // column already exists
}

try {
  sqlite.exec("ALTER TABLE packages ADD COLUMN duration_unit TEXT DEFAULT 'hours';");
} catch {
  // column already exists
}

try {
  sqlite.exec("ALTER TABLE packages ADD COLUMN duration_minutes INTEGER DEFAULT 60;");
} catch {
  // column already exists
}

try {
  sqlite.exec("ALTER TABLE packages ADD COLUMN speed_limit TEXT DEFAULT 'Unlimited';");
} catch {
  // column already exists
}

try {
  sqlite.exec("ALTER TABLE packages ADD COLUMN data_limit_mb INTEGER DEFAULT 0;");
} catch {
  // column already exists
}

try {
  sqlite.exec("ALTER TABLE users ADD COLUMN access_expires_at DATETIME;");
} catch {
  // column already exists
}

try {
  sqlite.exec("ALTER TABLE users ADD COLUMN used_data_mb REAL DEFAULT 0;");
} catch {
  // column already exists
}

// MySQL-compatible async pool wrapper so controllers work seamlessly
const pool = {
  query: async (sql, params = []) => {
    const trimmed = sql.trim();
    const isSelect = /^SELECT/i.test(trimmed);

    const cleanParams = (Array.isArray(params) ? params : [params]).map((p) =>
      p === undefined ? null : p
    );

    const stmt = sqlite.prepare(sql);

    if (isSelect) {
      const rows = stmt.all(...cleanParams);
      return [rows];
    } else {
      const info = stmt.run(...cleanParams);
      return [
        {
          insertId: Number(info.lastInsertRowid),
          affectedRows: info.changes
        }
      ];
    }
  }
};

const testConnection = async () => {
  try {
    sqlite.prepare("SELECT 1").get();
    console.log(`SQLite database connected successfully (${dbPath})`);
    return true;
  } catch (error) {
    console.error("SQLite database failed to initialize:", error.message);
    return false;
  }
};

const fs = require("fs");

/**
 * Creates an online, non-blocking atomic backup of the SQLite database.
 * Can be run safely even while the server is live and accepting transactions.
 */
const backupDatabase = async (customPath) => {
  const backupsDir = path.resolve(__dirname, "../../backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const targetPath = customPath || path.join(backupsDir, `wifi_portal_backup_${timestamp}.sqlite`);

  try {
    await sqlite.backup(targetPath);
    return {
      success: true,
      backupPath: targetPath,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Database backup failed:", error);
    throw error;
  }
};

/**
 * Returns health and size metrics for database monitoring.
 */
const getDatabaseStats = () => {
  try {
    const integrity = sqlite.prepare("PRAGMA integrity_check").get();
    const userCount = sqlite.prepare("SELECT COUNT(*) as count FROM users").get().count;
    const packageCount = sqlite.prepare("SELECT COUNT(*) as count FROM packages").get().count;
    const paymentCount = sqlite.prepare("SELECT COUNT(*) as count FROM payments").get().count;
    const voucherCount = sqlite.prepare("SELECT COUNT(*) as count FROM vouchers").get().count;
    const activeSessionCount = sqlite.prepare("SELECT COUNT(*) as count FROM active_sessions WHERE status = 'active'").get().count;

    let fileSizeBytes = 0;
    if (fs.existsSync(dbPath)) {
      fileSizeBytes = fs.statSync(dbPath).size;
    }

    return {
      status: integrity.integrity_check === "ok" ? "healthy" : "warning",
      integrity: integrity.integrity_check,
      fileSizeBytes,
      fileSizeFormatted: `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`,
      counts: {
        users: userCount,
        packages: packageCount,
        payments: paymentCount,
        vouchers: voucherCount,
        activeSessions: activeSessionCount
      }
    };
  } catch (error) {
    return {
      status: "error",
      error: error.message
    };
  }
};

module.exports = {
  pool,
  sqlite,
  testConnection,
  backupDatabase,
  getDatabaseStats
};