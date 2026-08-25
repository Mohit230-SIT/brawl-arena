# How to Deploy BRAWL with a Database

This version has **real database support**. Data survives server restarts.

---

## What Changed

The backend now uses **PostgreSQL** in production (on Render) and **JSON file storage** locally. When someone joins through the form, their data is saved to the database — permanently. When a brawl ends, clout is updated in the database. Restart the server, everything is still there.

---

## Option A: Render.com (Recommended — Free Database + Free Server)

### Step 1: Upload to GitHub

1. Unzip `BRAWL-Database-Edition.zip`
2. Go to github.com → New repository → name it `brawl-arena` → Public → Create
3. Upload ALL files from the unzipped folder (use GitHub Desktop if drag-drop doesn't work for folders)
4. Commit changes

### Step 2: Create a Free PostgreSQL Database on Render

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **New +** → **PostgreSQL**
3. Name it: `brawl-db`
4. Plan: **Free**
5. Click **Create Database**
6. Wait 1-2 minutes for it to provision
7. On the database page, find the **Connection String** (starts with `postgresql://...`)
8. Copy it — you'll need it in Step 3

### Step 3: Deploy the Web Server on Render

1. On Render, click **New +** → **Web Service**
2. Connect your `brawl-arena` GitHub repository
3. Fill in:
   - **Name**: `brawl-arena`
   - **Build Command**: `npm install`
   - **Start Command**: `node backend/server.js`
   - **Plan**: Free
4. Scroll down to **Environment Variables**
5. Click **Add Environment Variable**:
   - **Key**: `DATABASE_URL`
   - **Value**: paste the PostgreSQL connection string from Step 2
6. Click **Create Web Service**
7. Wait 2-3 minutes for build and deploy

### Step 4: Test It

Visit your live URL:
```
https://brawl-arena.onrender.com
```

Test the API:
```
https://brawl-arena.onrender.com/api/health
→ {"status":"ok","db":"postgresql","fighters":10,"uptime":...}

https://brawl-arena.onrender.com/api/leaderboard
→ {"leaderboard":[...],"total":10}
```

Now go to the website, fill in the Join form, and submit. Then visit:
```
https://brawl-arena.onrender.com/api/fighters
```

You'll see your new fighter saved in the database. Restart the server — data is still there.

---

## Option B: Run Locally with Database

If you want to run locally without installing PostgreSQL, the server automatically uses JSON file storage:

```bash
cd brawl-website
npm install
npm start
```

Visit `http://localhost:3000`. When someone joins, their data is saved to `backend/data.json`. Restart the server — data is still there.

---

## How Data Persistence Works

| Environment | Database | How It Works |
|-------------|----------|-------------|
| Local (no DATABASE_URL) | JSON file (`backend/data.json`) | Data saved to a file on disk. Survives restarts. |
| Render (DATABASE_URL set) | PostgreSQL | Data saved to a real database. Survives restarts, scaling, everything. |

The server automatically detects which to use. No code changes needed.

---

## API Endpoints

All endpoints work the same regardless of database type:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health + database type + fighter count |
| GET | `/api/prompts/random` | Random debate prompt + assigned side |
| GET | `/api/leaderboard?sort=clout&campus=iitb` | Ranked fighters (filterable) |
| GET | `/api/fighters` | All registered fighters |
| POST | `/api/join` | Register new fighter (saved to DB) |
| POST | `/api/brawl/start` | Create a new brawl session |
| POST | `/api/vote` | Cast a vote |
| POST | `/api/brawl/end` | End brawl, update clout in DB |

---

## Troubleshooting

**"pg module not found" on Render:**
Make sure `package.json` in the root has `"pg": "^8.11.3"` in dependencies. Run `npm install` on Render.

**Database connection fails:**
Make sure you copied the full connection string including `postgresql://` prefix. Make sure the environment variable is named exactly `DATABASE_URL`.

**Data resets on restart:**
You're running locally without PostgreSQL. The JSON file should persist. Check that `backend/data.json` exists and has data. If using Render, make sure `DATABASE_URL` is set as an environment variable.

**Render free tier sleeps:**
The server sleeps after 15 minutes of inactivity. The database does NOT sleep — data is always saved. Visit the URL 1 minute before your presentation to wake the server.
