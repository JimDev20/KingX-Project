# Deployment Guide

## Prerequisites

- GitHub account with the repo pushed
- Render account (render.com)
- Vercel account (vercel.com)

---

## Step 1: Create PostgreSQL Database on Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - **Name**: `kingx-db`
   - **Database**: `kingx` (or leave default)
   - **User**: `kingx_user` (or leave default)
   - **Region**: choose nearest to you
   - **Plan**: **Free**
4. Click **Create Database**
5. Wait ~2 minutes until status shows **Available**
6. Copy these two values from the dashboard:
   - **Internal Database URL** (used by Render services internally)
   - **External Database URL** (used from outside Render)

---

## Step 2: Deploy the API (backend-ts) on Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub account if not already connected
4. Select repo: `KingX-Project`
5. Fill in:
   - **Name**: `kingx-api`
   - **Region**: same as your database
   - **Branch**: `master`
   - **Runtime**: **Node**
   - **Root Directory**: **`backend-ts`**
   - **Build Command**:
     ```
     npm run render-build
     ```
   - **Start Command**:
     ```
     npm start
     ```
   - **Plan**: **Free**
6. Click **Advanced** → **Add Environment Variable** and add these:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Paste **Internal Database URL** from Step 1 |
   | `DIRECT_URL` | Paste **External Database URL** from Step 1 |
   | `JWT_SECRET` | Type any random string (e.g. `k1ngx_d3pl0y_s3cr3t`) |
   | `CORS_ORIGIN` | Leave empty for now (update after Step 3) |

7. Click **Create Web Service**
8. Wait ~3-5 minutes for build + deploy
9. Once **Live**, copy your API URL (e.g. `https://kingx-api.onrender.com`)

---

## Step 3: Run DB Migration

1. Go to your Render web service dashboard
2. Click **Shell** tab (if available) or use the **Manual Run**:
   - Click **Manual Run** → type: `npx prisma db push`
3. If Shell is not available, instead go to your Render web service → **Manual Run** → select **New Run**
   - **Run Command**: `npx prisma db push`
4. Wait for it to complete

---

## Step 4: Deploy the Frontend (frontend-next) on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repo `JimDev20/KingX-Project`
4. In **Configure Project**:
   - **Root Directory**: Click Edit → select **`frontend-next`**
   - **Framework Preset**: should auto-detect **Next.js**
   - **Build Command**: leave default
   - **Output Directory**: leave default
5. Click **Environment Variables** → add:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://kingx-api.onrender.com/api` (replace with your actual Render URL) |

6. Click **Deploy**
7. Wait ~2 minutes
8. Once done, copy your Vercel URL (e.g. `https://kingx.vercel.app`)

---

## Step 5: Update CORS

1. Go back to Render → your `kingx-api` web service
2. Click **Environment** → **Add Environment Variable**
3. Add:
   - **Key**: `CORS_ORIGIN`
   - **Value**: `https://kingx.vercel.app` (your actual Vercel URL)
4. Click **Save Changes**
5. At the top, click **Manual Deploy** → **Clear build cache & deploy**

---

## Step 6: Verify

1. Open your Vercel URL in a browser
2. Register a new account
3. Add a website to monitor
4. Everything should work end-to-end

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Frontend shows "Network Error" | Check `NEXT_PUBLIC_API_URL` on Vercel. Check `CORS_ORIGIN` on Render. |
| Backend shows "Can't reach database" | Double-check `DATABASE_URL` and `DIRECT_URL` values. |
| Login returns "Invalid credentials" | The migration copied users from old MongoDB. Register a new account. |
| Build fails | Check build logs. Common issue: missing `prisma generate` step. |
