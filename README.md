# WaveNet - MikroTik WiFi Captive Portal

A modern, full-stack captive portal management system tailored for MikroTik routers and No-Expiry Data Bundles.

## 🌟 Key Features

- **MikroTik Hotspot Integration**: Automatically intercepts new devices, captures router parameters (`mac`, `ip`, `link-login`), and authenticates user devices upon payment.
- **Ghanaian Mobile Money Ready**: Built for Ghana with **MTN MoMo**, **Telecel Cash**, and **Card** options in **GH₵**.
- **No-Expiry Data Bundles**: Volume-based metering (e.g. 500MB, 1GB, 2.5GB, 5GB, 10GB, 25GB) where data stays active until exhausted.
- **Real-Time Data Balance Meter**: Customers can view remaining data, used data, and a live progress bar.
- **Self-Contained SQLite Database**: Embedded SQLite via `better-sqlite3` in WAL mode — zero database server configuration or maintenance needed.
- **Admin Workspace**: Complete dashboard to manage customer accounts, monitor transactions, and add/edit/delete data bundles in real time.
- **Client-Friendly MikroTik Guide**: Complete with step-by-step instructions and one-click copy-paste terminal scripts.

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
# In the root directory
npm install
node src/seed.js   # Seeds the initial database with Ghana data bundles and users
npm start          # Starts the backend API server on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev        # Starts the Vite React app on http://localhost:5173
```

---

## 📡 MikroTik Router Setup

See the comprehensive guide in [`mikrotik/MIKROTIK_INTEGRATION_GUIDE.md`](mikrotik/MIKROTIK_INTEGRATION_GUIDE.md) and use the redirect template in [`mikrotik/login.html`](mikrotik/login.html).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, React Router 7, Axios
- **Backend**: Node.js, Express 5, JWT, bcryptjs
- **Database**: SQLite (`better-sqlite3`) in WAL mode
- **Hardware Compatibility**: MikroTik RouterOS (Hotspot, Walled Garden, HTTP PAP)
