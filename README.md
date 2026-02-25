# 🎮 Liquid Runner — Deployment Guide

## Project Structure
```
liquid-runner/
├── server.js          # Backend (Express API + static files)
├── package.json       # Dependencies
├── leaderboard.json   # Auto-created on first run
└── public/
    └── index.html     # The game
```

---

## 🚀 Option 1: Deploy to Render.com (FREE — Recommended)

1. **Push to GitHub:**
   ```bash
   cd liquid-runner
   git init
   git add .
   git commit -m "Liquid Runner game"
   git remote add origin https://github.com/YOUR_USERNAME/liquid-runner.git
   git push -u origin main
   ```

2. **Go to [render.com](https://render.com) → New → Web Service**

3. **Connect your GitHub repo**

4. **Settings:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Free tier** is fine

5. **Deploy!** Your game will be live at `https://liquid-runner-xxxx.onrender.com`

> ⚠️ Free tier sleeps after 15 min inactivity. First load may take ~30s to wake up.

---

## 🚀 Option 2: Deploy to Railway.app (FREE)

1. Push to GitHub (same as above)
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo → Deploy
4. Done! Railway auto-detects Node.js

---

## 🚀 Option 3: Run Locally

```bash
cd liquid-runner
npm install
npm start
```

Open `http://localhost:3000` in your browser.

---

## 🚀 Option 4: Deploy to VPS (DigitalOcean, etc.)

```bash
# On your server:
git clone https://github.com/YOUR_USERNAME/liquid-runner.git
cd liquid-runner
npm install
npm start

# Or with PM2 for auto-restart:
npm install -g pm2
pm2 start server.js --name liquid-runner
pm2 save
pm2 startup
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Top 50 scores |
| POST | `/api/score` | Submit score `{name, score, coin, time}` |
| GET | `/api/stats` | Total players + top player |

---

## 🔒 Security Notes

- Rate limited: 10 requests/minute per IP
- Name sanitized (no HTML/XSS)
- Score capped at 999,999
- Only top 200 scores stored
- Input validation on all fields

---

## 📝 Customization

- Change `PORT` via environment variable
- Edit `public/index.html` for game tweaks
- `leaderboard.json` is the database (auto-created)

Made by Hellish · Powered by Liquid
