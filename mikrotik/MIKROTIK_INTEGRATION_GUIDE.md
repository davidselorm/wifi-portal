# 🚀 Simple Step-by-Step MikroTik Setup Guide (WaveNet WiFi Portal)

Welcome! You **do not need to be a network engineer** to connect your MikroTik router to your new **WaveNet WiFi Portal**. 

Just follow this guide step-by-step. In about **10 minutes**, your WiFi network will automatically redirect guests to your portal so they can buy data bundles and get connected!

---

## 📋 What You Need Before Starting

1. Your **MikroTik router** powered on and connected to your internet modem.
2. A computer (Windows recommended) plugged into one of the LAN ports of the router.
3. The free **Winbox** tool downloaded from the official MikroTik website: [mikrotik.com/download](https://mikrotik.com/download) (run `Winbox64.exe`).
4. The file `login.html` located in the `mikrotik/` folder of this project.

---

## 💡 How It Works (In Plain English)

1. A customer walks in and connects to your WiFi SSID.
2. Their phone immediately opens your **WaveNet Portal** (Sign in / Register).
3. The customer selects a **No-Expiry Data Bundle** (e.g. 1 GB for GH₵ 5 or 2.5 GB for GH₵ 12) and pays with **MTN MoMo** or **Telecel Cash**.
4. Once paid, the portal automatically tells the MikroTik router: *"Grant internet access to this device!"*
5. The customer browses the internet until their data quota finishes. Once finished, they top up again!

---

## 🛠️ The 4 Simple Setup Steps

---

### Step 1: Open Winbox and Log In

1. Open **Winbox** on your computer.
2. Click on the **Neighbors** tab at the bottom.
3. You will see your router appear. Click on its **MAC Address**.
4. Enter your login:
   - **Login**: `admin`
   - **Password**: *(leave empty unless you set one)*
5. Click **Connect**.

---

### Step 2: Upload the `login.html` Redirect File

This file tells the router: *"When someone connects, immediately send their phone to our portal website."*

1. Open `mikrotik/login.html` on your computer using Notepad.
2. On line 61, make sure the URL matches where your portal is running:
   ```javascript
   // Change to your portal address (e.g. https://wifi.yourbusiness.com/login or your server IP)
   var PORTAL_BASE_URL = "http://192.168.88.2:5173/login";
   ```
3. In **Winbox**, click on **Files** in the left sidebar.
4. Locate the folder named `hotspot` in the files list.
5. **Drag and drop** your edited `login.html` directly into the `hotspot` folder in Winbox.
   *(This replaces the default MikroTik login page with your WaveNet portal redirect).*

---

### Step 3: Allow the Portal & Mobile Money (Walled Garden)

> **What is the Walled Garden?**  
> When a new customer connects, they **do not have internet yet**. The Walled Garden is simply a VIP list that allows their phone to open your portal and connect to MTN MoMo / Telecel Cash to pay **before** they have full internet access.

We made this super easy! You can copy and paste this entire block at once:

1. In Winbox, click on **New Terminal** in the left sidebar (a black window will open).
2. Copy the text below, **right-click inside the terminal window**, and select **Paste**:

```routeros
# ==========================================
# 1. ALLOW PORTAL & LOCAL SERVER
# ==========================================
/ip hotspot walled-garden
add dst-host="*localhost*" action=allow
add dst-host="*wavenet*" action=allow

# If your portal runs on a local computer IP (e.g. 192.168.88.2), allow it:
/ip hotspot walled-garden ip
add dst-address=192.168.88.2 action=accept

# ==========================================
# 2. ALLOW GHANA MOBILE MONEY & PAYMENT GATEWAYS
# ==========================================
/ip hotspot walled-garden
add dst-host="*paystack.co*" action=allow
add dst-host="*paystack.com*" action=allow
add dst-host="*flutterwave.com*" action=allow
add dst-host="*hubtel.com*" action=allow
add dst-host="*mtn.com.gh*" action=allow
add dst-host="*telecel.com.gh*" action=allow
```

3. Press **Enter** on your keyboard. That's it!

---

### Step 4: Turn on Web Login (HTTP PAP) & Set Up Guests

1. In Winbox, click **IP** -> **Hotspot** in the left menu.
2. Click on the **Server Profiles** tab at the top.
3. Double-click on your hotspot profile (usually named `hsprof1` or `default`).
4. Click on the **Login** tab inside the window that opens:
   - ✅ Make sure **HTTP PAP** is **checked** *(this allows the portal to log users in smoothly)*.
   - ❌ Uncheck **Cookie** while testing so you can test logins repeatedly.
5. Click **OK** to save.

6. Next, click **New Terminal** again, paste this command, and press **Enter**:
```routeros
# Allow unlimited guest devices to log in via the portal
/ip hotspot user profile set [ find default=yes ] shared-users=unlimited
/ip hotspot user add name="guest" password="wifi-access" profile=default
```

---

## 🎉 You're Done! How to Test It

1. Take your smartphone and connect to the WiFi network.
2. Within a few seconds, a notification saying **"Sign in to Wi-Fi network"** will pop up on your phone.
3. Tap it — your **WaveNet WiFi Portal** will open on your screen!
4. Register with your name and Ghana phone number (`+233...`).
5. Choose any **No-Expiry Data Bundle** (e.g., 1 GB for GH₵ 5).
6. Complete payment and tap **Activate Internet Access**.
7. Try opening YouTube or Google — you are now online!

---

## ❓ Frequently Asked Questions & Troubleshooting

### Q: Why didn't the portal pop up on my phone when I connected?
- **Fix**: Open your mobile browser (Safari or Chrome) and try visiting any regular website like `http://neverssl.com` or `http://example.com`. The router will immediately catch it and open the portal.

### Q: How do I change bundle prices or add a new package?
- You do **NOT** need to touch the router! Just log in as Admin on your portal computer:
  - Visit: **http://localhost:5173/admin/packages**
  - Click **"New data bundle"** to add any bundle size and price in GH₵, or delete old ones with one click.

### Q: Can I enforce exact data limits (e.g. 1GB, 5GB) directly on the router?
- **Yes!** When a user buys 1GB, MikroTik can track their exact bytes. In MikroTik Terminal:
  ```routeros
  # Give a user exactly 1 GB with No Expiry:
  /ip hotspot user add name="+233241234567" password="wifi-access" limit-bytes-total=1073741824
  ```
  Once they download and upload 1 GB, the router automatically turns off their internet and redirects them back to the portal to top up!

---

### Need Help?
Everything in your software is already built and ready. If you need assistance with any specific step on your router model, let us know your MikroTik model name (e.g. hAP ac², hAP ax³, RB750Gr3) and we will provide custom guidance!
