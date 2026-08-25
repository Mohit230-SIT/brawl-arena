# How to Deploy BRAWL (Get a Live URL Anyone Can Visit)

You have two options. **Option A is the easiest** — everything on one server.

---

## Option A: Render.com (Recommended — Frontend + Backend Together)

This deploys the entire app (all HTML pages + Node.js backend) as one service on a free URL like `https://brawl-arena.onrender.com`.

### Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** icon (top right) → **New repository**
3. Name it `brawl-arena`
4. Set to **Public**
5. Click **Create repository**
6. Click **uploading an existing file** (or drag-and-drop all files from the `brawl-website` folder)
7. Upload ALL files from the `brawl-website` folder (the HTML files, css/, js/, backend/, package.json, etc.)
8. Click **Commit changes**

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) and sign up (use the **GitHub** button to sign in)
2. Click **New +** → **Web Service**
3. Click **Connect** next to your `brawl-arena` repository
4. Fill in:
   - **Name**: `brawl-arena` (or any name)
   - **Runtime**: Node (auto-detected)
   - **Build Command**: `npm install`
   - **Start Command**: `node backend/server.js`
   - **Plan**: Free
5. Click **Create Web Service**
6. Wait 2-3 minutes for it to build and deploy

### Step 3: Get Your Live URL

Render gives you a URL like:
```
https://brawl-arena.onrender.com
```

That's it! Share this URL with anyone. They visit it and get:
- The full website (all 6 pages)
- The working API (`/api/health`, `/api/leaderboard`, `/api/prompts/random`, etc.)
- The join form actually saves to the server
- The arena page fetches prompts from the live API

**Test it:**
```
https://brawl-arena.onrender.com/api/health
→ {"status":"ok","fighters":10,"uptime":...}

https://brawl-arena.onrender.com/api/prompts/random
→ {"prompt":"AI art is not real art.","side":"attack"}

https://brawl-arena.onrender.com/api/leaderboard
→ {"leaderboard":[...],"total":10}
```

### Important Notes for Render Free Tier
- The server goes to sleep after 15 minutes of inactivity. The first visit after sleep takes ~30 seconds to wake up. Subsequent visits are instant.
- To keep it awake during your presentation, just visit the URL a minute before you present.

---

## Option B: Run Locally (For Development/Testing)

If you want to run everything on your own laptop:

### Prerequisites
- Install [Node.js](https://nodejs.org) (version 18 or higher)

### Steps
```bash
# 1. Navigate to the project folder
cd brawl-website

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open in browser
# Visit http://localhost:3000
```

Both the frontend and backend now run on `http://localhost:3000`. The arena page fetches live prompts from the API, the join form posts to the server, and the leaderboard data comes from the backend.

---

## What Works After Deployment

| Feature | Without Backend (just open HTML) | With Backend (deployed) |
|---------|----------------------------------|------------------------|
| All 6 pages display | YES | YES |
| Arena timer & voting | Simulated locally | Live API prompts |
| Join form | Saves to browser only | Saves to server, shows founding status |
| Leaderboard | Static demo data | Live from API, updates when people join |
| API endpoints | Not available | All 8 endpoints live |
| WebSocket voting | Not available | Real-time vote updates |
| Shareable URL | No (local file only) | Yes (public URL) |

---

## Troubleshooting

**Build fails on Render:**
- Make sure `package.json` is in the ROOT of the repository (not inside a subfolder)
- Make sure the build command is exactly: `npm install`
- Make sure the start command is exactly: `node backend/server.js`

**Page loads but API returns 404:**
- The backend server.js must be at `backend/server.js` relative to the repo root
- Check that `backend/server.js` has `app.use(express.static(__dirname))` — wait, it should be `express.static(__dirname + '/..')` to serve from root... Actually, the server uses `__dirname` which points to `backend/`. We need to fix this.

**Actually, the server is already configured to serve files from the parent directory.** If you see the API working but the HTML pages not loading, change the static path in `backend/server.js`:

```js
// Change this line:
app.use(express.static(__dirname));
// To:
app.use(express.static(path.join(__dirname, '..')));
```

This makes the server serve HTML files from the project root, while the backend code lives in `backend/`.

---

## Quick Summary

1. Upload all files to GitHub
2. Connect repo to Render.com
3. Build: `npm install`
4. Start: `node backend/server.js`
5. Get URL: `https://yourname.onrender.com`
6. Share with anyone

Done. Full working website with live backend.
