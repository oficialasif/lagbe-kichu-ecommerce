# Vercel Deployment Guide - Frontend

This guide will help you deploy the Lagbe Kichu frontend to Vercel.

## Prerequisites

- ✅ GitHub repository pushed (https://github.com/oficialasif/lagbe-kichu-ecommerce)
- ✅ Frontend build tested locally (`npm run build`)
- ✅ Vercel account (free tier available)

## Step-by-Step Deployment

### Step 1: Create Vercel Account

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended for easiest integration)
4. Authorize Vercel to access your GitHub account

### Step 2: Import Your Project

1. After logging in, you'll see the Vercel dashboard
2. Click **"Add New..."** → **"Project"**
3. You'll see your GitHub repositories listed
4. Find **"lagbe-kichu-ecommerce"** and click **"Import"**

### Step 3: Configure Project Settings

Vercel will automatically detect Next.js, but you need to configure:

1. **Framework Preset:** Should auto-detect as "Next.js"
2. **Root Directory:** Change from `/` to `/frontend`
   - Click **"Edit"** next to Root Directory
   - Enter: `frontend`
3. **Build Command:** Should auto-detect as `npm run build` (verify it's `cd frontend && npm run build` if needed)
4. **Output Directory:** Should be `.next` (auto-detected)
5. **Install Command:** Should be `npm install` (auto-detected)

### Step 4: Configure Environment Variables

Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

**Important Notes:**
- Replace `https://your-backend-url.com/api` with your actual backend API URL
- If backend is also deployed (e.g., on Railway, Render, etc.), use that URL
- For development/testing, you can use your backend deployment URL
- The `NEXT_PUBLIC_` prefix is required for Next.js to expose this to the browser

### Step 5: Deploy

1. Click **"Deploy"** button
2. Vercel will:
   - Install dependencies
   - Build your Next.js app
   - Deploy to a global CDN
3. Wait for the deployment to complete (usually 2-5 minutes)

### Step 6: Get Your Deployment URL

Once deployment is successful:
- You'll get a unique URL like: `https://lagbe-kichu-ecommerce.vercel.app`
- You can also add a custom domain later

### Step 7: Update Backend CORS (Important!)

After getting your Vercel URL, update your backend CORS configuration:

1. Go to your backend `.env` file
2. Update `CORS_ORIGIN` to include your Vercel URL:
   ```
   CORS_ORIGIN=https://lagbe-kichu-ecommerce.vercel.app,http://localhost:3000
   ```
3. Redeploy your backend (if already deployed)

### Step 8: Test the Deployment

1. Visit your Vercel URL
2. Test key features:
   - User registration/login
   - Product browsing
   - Cart functionality
   - API connectivity

## Continuous Deployment

Once connected, Vercel automatically:
- ✅ Deploys on every push to `main` branch
- ✅ Creates preview deployments for pull requests
- ✅ Provides deployment history and rollback options

## Custom Domain (Optional)

1. Go to your project settings on Vercel
2. Click **"Domains"**
3. Add your custom domain (e.g., `lagbekichu.com`)
4. Follow DNS configuration instructions
5. Vercel will automatically provision SSL certificates

## Troubleshooting

### Build Fails
- Check build logs on Vercel dashboard
- Ensure `npm run build` works locally first
- Verify environment variables are set correctly

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend CORS configuration includes Vercel URL
- Ensure backend is deployed and accessible

### Environment Variables Not Working
- Make sure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

## Production Checklist

- [ ] Environment variables configured
- [ ] Backend CORS updated with Vercel URL
- [ ] Build succeeds locally
- [ ] All API endpoints working
- [ ] Images loading correctly
- [ ] Authentication working
- [ ] Custom domain configured (if needed)

## Need Help?

- Vercel Documentation: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment

---

**Deployment URL:** Will be provided after deployment
**Status:** Ready to deploy 🚀

