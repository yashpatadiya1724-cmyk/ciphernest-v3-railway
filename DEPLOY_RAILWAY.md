# 🚀 CipherNest v2 — Railway Deployment Guide

## What you get after deploying:
✅ Full web app accessible from **any phone/browser worldwide**  
✅ Mobile-friendly UI with bottom navigation bar  
✅ All security tools working  
✅ AI chat (Gemini/Groq)  
✅ Secure Vault, WiFi Guard, Threat Map, etc.

---

## Step 1 — MongoDB Atlas (Free Database)

1. Go to **https://cloud.mongodb.com** → Sign up free
2. Click **"Create"** → Choose **M0 Free** tier → Select any region → Create
3. Under **Security → Database Access** → Add user  
   - Username: `ciphernest`  
   - Password: (generate a strong one, save it!)
4. Under **Security → Network Access** → Add IP: `0.0.0.0/0` (allow all — Railway needs this)
5. Under **Deployment → Database** → Click **Connect** → **Drivers**  
   - Copy the URI — looks like:  
   `mongodb+srv://ciphernest:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Change `?` part to `/ciphernest?` so it becomes:  
   `mongodb+srv://ciphernest:PASSWORD@cluster0.xxxxx.mongodb.net/ciphernest?retryWrites=true&w=majority`

---

## Step 2 — AI API Key (Free)

**Option A — Google Gemini (Recommended, completely free):**
1. Go to **https://aistudio.google.com/app/apikey**
2. Click **"Create API Key"** → Copy it

**Option B — Groq (Also free, very fast):**
1. Go to **https://console.groq.com/keys**
2. Create API key → Copy it

---

## Step 3 — Deploy to Railway

### Method A: GitHub (Recommended)

1. Create a GitHub account at **github.com** if you don't have one
2. Create a **new repository** (private is fine)
3. Upload this entire `ciphernest-v3` folder to GitHub  
   (You can drag-and-drop files in the GitHub web UI)
4. Go to **https://railway.app** → Sign up with GitHub
5. Click **"New Project"** → **"Deploy from GitHub repo"**
6. Select your repository → Railway auto-detects the config

### Method B: Railway CLI (Faster)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inside the ciphernest-v3 folder:
cd ciphernest-v3
railway init
railway up
```

---

## Step 4 — Set Environment Variables in Railway

In Railway dashboard → Your project → **Variables** tab → Add these:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your Atlas URI from Step 1 |
| `JWT_SECRET` | Any long random string (e.g. `MySuper$ecret2025XYZ`) |
| `GEMINI_API_KEY` | Your Gemini key from Step 2 |
| `AI_PROVIDER` | `gemini` |

Click **"Deploy"** after adding variables.

---

## Step 5 — Access Your App

1. In Railway → Your project → click **"Settings"**
2. Under **Networking** → click **"Generate Domain"**
3. You get a URL like: `https://ciphernest-production.up.railway.app`
4. **Open this on your phone browser** — it works like an app!
5. **Add to Home Screen** on iPhone: Share button → "Add to Home Screen"  
   On Android: Menu → "Add to Home Screen" / "Install App"

---

## ⚠️ Railway Notes

- Free plan: **500 hours/month** (enough for personal use)
- App sleeps after 10min of inactivity (wakes up in ~3 seconds)
- To keep it always awake: Upgrade to $5/month Hobby plan

---

## 🔧 Local Development

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env     # fill in your values
npm install
npm run dev

# Terminal 2 — Frontend  
cd frontend
npm install
npm run dev

# Open: http://localhost:5173
```

---

## 📱 Tools available in cloud vs local:

| Tool | Railway (Cloud) | Local Install |
|------|----------------|---------------|
| Phishing Detector | ✅ Full | ✅ Full |
| Password Analyzer | ✅ Full | ✅ Full |
| Breach Checker | ✅ Full | ✅ Full |
| Domain Reputation | ✅ Full | ✅ Full |
| Web Scanner | ✅ Full | ✅ Full |
| Encryption/Hash | ✅ Full | ✅ Full |
| JWT / Base64 / Binary | ✅ Full | ✅ Full |
| AI Chat (Cipher) | ✅ Full | ✅ Full |
| Secure Vault | ✅ Full | ✅ Full |
| Live Threat Map | ✅ Full | ✅ Full |
| Dark Web Monitor | ✅ Full | ✅ Full |
| AI File Sandbox | ✅ Full | ✅ Full |
| WiFi Guard | 🟡 Demo data | ✅ Real scan |
| Process Watcher | 🟡 Info only | ✅ Real processes |
| Network Map | 🟡 Info only | ✅ Real interfaces |
| System Stats | 🟡 Simulated | ✅ Real metrics |
| Honeypot | 🟡 Simulation | ✅ Live TCP trap |
