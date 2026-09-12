const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.resolve(__dirname, "../../wifi_portal.sqlite");
const sqlite = new Database(dbPath);

// Enable WAL mode for high concurrency
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Automatically ensure tables exist
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

sqlite.exec(`
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
`);

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

module.exports = {
  pool,
  sqlite,
  testConnection
};