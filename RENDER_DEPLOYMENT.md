# Render Deployment Guide - Backend

This guide will help you deploy the Lagbe Kichu backend (Express.js) to Render.

## Prerequisites

- ✅ GitHub repository pushed (https://github.com/oficialasif/lagbe-kichu-ecommerce)
- ✅ Backend builds locally (`npm run build`)
- ✅ Render account (free tier available at https://render.com)

## Step-by-Step Deployment

### Step 1: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"** or **"Sign Up"**
3. Choose **"Sign up with GitHub"** (recommended for easiest integration)
4. Authorize Render to access your GitHub account
5. Complete your account setup

### Step 2: Create New Web Service

1. After logging in, click **"New +"** button (top right)
2. Select **"Web Service"**
3. You'll see options to connect repositories

### Step 3: Connect GitHub Repository

1. If this is your first time:
   - Click **"Connect account"** next to GitHub
   - Authorize Render to access your repositories
2. Find and select **"lagbe-kichu-ecommerce"** repository
3. Click **"Connect"**

### Step 4: Configure Web Service

Fill in the following settings:

#### Basic Settings:
- **Name:** `lagbe-kichu-backend` (or your preferred name)
- **Region:** Choose closest to your users (e.g., `Singapore`, `Frankfurt`, `Oregon`)
- **Branch:** `main` (or your default branch)
- **Root Directory:** `backend` ⚠️ **IMPORTANT: Set this to `backend`**

#### Build & Deploy:
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Important Notes:**
- Root Directory must be `backend` (not the root of the repo)
- Build command compiles TypeScript to JavaScript
- Start command runs the compiled server from `dist/server.js`

### Step 5: Configure Environment Variables

Click **"Environment"** tab and add all required variables:

```env
PORT=10000
NODE_ENV=production
BASE_URL=https://your-app-name.onrender.com
MONGODB_URI=your-mongodb-connection-string
CORS_ORIGIN=https://your-frontend-url.vercel.app,http://localhost:3000
JWT_ACCESS_SECRET=your-secure-access-token-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-secure-refresh-token-secret-key-minimum-32-characters
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Important Notes:**
- **PORT:** Render sets this automatically, but `10000` is a safe default
- **MONGODB_URI:** Use MongoDB Atlas connection string (see Step 6)
- **CORS_ORIGIN:** Add your Vercel frontend URL (you can update this later)
- **JWT Secrets:** Generate secure random strings (minimum 32 characters)
- **Email:** Use Gmail App Password (not regular password)
- **Cloudinary:** Optional, but recommended for file uploads

### Step 6: Set Up MongoDB Atlas (If Not Already Done)

If you don't have MongoDB set up:

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create a free cluster
4. Get your connection string:
   - Click **"Connect"** on your cluster
   - Choose **"Connect your application"**
   - Copy the connection string
   - Replace `<password>` with your database user password
5. Whitelist Render IPs (or use `0.0.0.0/0` for all IPs - less secure but easier)

**Example MongoDB URI:**
```
mongodb+srv://username:password@cluster.mongodb.net/lagbe-kichu?retryWrites=true&w=majority
```

### Step 7: Deploy

1. Click **"Create Web Service"** button
2. Render will:
   - Clone your repository
   - Install dependencies
   - Run build command
   - Start your server
3. First deployment usually takes 5-10 minutes

### Step 8: Get Your Backend URL

Once deployment is successful:
- You'll get a URL like: `https://lagbe-kichu-backend.onrender.com`
- Copy this URL - you'll need it for frontend configuration

### Step 9: Update Environment Variables (After Deployment)

After deployment completes:

1. Go to your service settings
2. Click **"Environment"**
3. Update `BASE_URL` with your actual Render URL:
   ```
   BASE_URL=https://lagbe-kichu-backend.onrender.com
   ```
4. Update `CORS_ORIGIN` when you have frontend URL:
   ```
   CORS_ORIGIN=https://your-frontend.vercel.app,http://localhost:3000
   ```

### Step 10: Test Your Backend

1. Visit your backend URL: `https://lagbe-kichu-backend.onrender.com`
2. Test API endpoints:
   - Health check: `https://lagbe-kichu-backend.onrender.com/api/health` (if exists)
   - Categories: `https://lagbe-kichu-backend.onrender.com/api/categories`
3. Check logs in Render dashboard for any errors

## Important Configuration Notes

### Root Directory Configuration

Since your backend is in the `backend/` folder:
- **Root Directory:** Must be set to `backend`
- This tells Render where to find your `package.json` and source code

### Build Configuration

- **Build Command:** `npm install && npm run build`
  - Installs dependencies
  - Compiles TypeScript to JavaScript in `dist/` folder
- **Start Command:** `npm start`
  - Runs `node dist/server.js` (as defined in package.json)

### Environment Variables Security

- ✅ Never commit `.env` files to GitHub
- ✅ Add all secrets in Render dashboard
- ✅ Use strong, randomly generated secrets
- ✅ Rotate secrets periodically

## Render Free Tier Limitations

- **Spins down after 15 minutes of inactivity**
- **Cold start:** First request after spin-down takes 30-60 seconds
- **Upgrade to paid:** Keeps service always running

## Troubleshooting

### Deployment Fails

**Check Build Logs:**
1. Go to your service dashboard
2. Click **"Logs"** tab
3. Look for error messages
4. Common issues:
   - Missing environment variables
   - MongoDB connection issues
   - TypeScript compilation errors

### Service Won't Start

**Check Start Command:**
- Verify `npm start` is correct
- Check `package.json` has `"start": "node dist/server.js"`
- Ensure build completed successfully

### MongoDB Connection Issues

**Verify:**
- MongoDB Atlas cluster is running
- Connection string is correct
- Network access allows Render IPs (or `0.0.0.0/0`)
- Database user credentials are correct

### Environment Variables Not Working

**Check:**
- Variable names match exactly (case-sensitive)
- No extra spaces or quotes
- Secrets are properly set
- Redeploy after changing variables

### CORS Errors

**Solution:**
- Update `CORS_ORIGIN` in environment variables
- Include your frontend URL
- Redeploy backend after changes

## Production Checklist

- [ ] Render account created
- [ ] Web Service created
- [ ] Root Directory set to `backend`
- [ ] Build and Start commands configured
- [ ] All environment variables added
- [ ] MongoDB Atlas configured and connected
- [ ] JWT secrets generated (secure random strings)
- [ ] Email configured (Gmail App Password)
- [ ] Cloudinary configured (optional)
- [ ] Service deployed successfully
- [ ] Backend URL obtained
- [ ] API endpoints tested
- [ ] Logs checked for errors

## Next Steps

After backend is deployed:

1. ✅ Note your backend URL
2. ✅ Deploy frontend on Vercel (see `VERCEL_DEPLOYMENT.md`)
3. ✅ Update backend `CORS_ORIGIN` with Vercel URL
4. ✅ Update frontend `NEXT_PUBLIC_API_URL` with Render backend URL
5. ✅ Test full application

## Need Help?

- Render Documentation: https://render.com/docs
- MongoDB Atlas Setup: https://www.mongodb.com/docs/atlas
- Render Support: Available in dashboard

---

**Backend URL:** Will be provided after deployment (e.g., `https://lagbe-kichu-backend.onrender.com`)
**Status:** Ready to deploy 🚀

