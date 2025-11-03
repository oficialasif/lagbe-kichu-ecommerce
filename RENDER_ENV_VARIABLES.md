# Backend Environment Variables for Render

Copy and paste these environment variables into your Render dashboard **Environment** section.

## Required Environment Variables

```env
PORT=10000
NODE_ENV=production
BASE_URL=https://your-app-name.onrender.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lagbe-kichu?retryWrites=true&w=majority
CORS_ORIGIN=http://localhost:3000
JWT_ACCESS_SECRET=your-secure-access-token-secret-key-here-minimum-32-characters
JWT_REFRESH_SECRET=your-secure-refresh-token-secret-key-here-minimum-32-characters
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Detailed Explanation

### 1. Server Configuration

```env
PORT=10000
```
- **Purpose:** Port number for the Express server
- **Note:** Render sets `PORT` automatically, but `10000` is a safe default
- **Can be:** Any available port (Render will override if needed)

```env
NODE_ENV=production
```
- **Purpose:** Environment mode
- **Options:** `development` or `production`
- **Note:** Must be `production` for deployment

```env
BASE_URL=https://your-app-name.onrender.com
```
- **Purpose:** Base URL of your deployed backend
- **Replace:** `your-app-name` with your actual Render service name
- **Example:** `https://lagbe-kichu-backend.onrender.com`
- **Note:** Update this after deployment with your actual Render URL

### 2. Database Configuration

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lagbe-kichu?retryWrites=true&w=majority
```
- **Purpose:** MongoDB connection string
- **Replace:** 
  - `username` with your MongoDB Atlas username
  - `password` with your MongoDB Atlas password
  - `cluster.mongodb.net` with your actual cluster URL
  - `lagbe-kichu` with your database name
- **Example:** `mongodb+srv://admin:MySecurePass123@cluster0.abc123.mongodb.net/lagbe-kichu?retryWrites=true&w=majority`
- **How to get:** 
  1. Go to MongoDB Atlas → Connect → Connect your application
  2. Copy the connection string
  3. Replace `<password>` with your database password

### 3. CORS Configuration

```env
CORS_ORIGIN=http://localhost:3000
```
- **Purpose:** Allowed frontend origins
- **For production:** Update with your Vercel frontend URL
- **Multiple origins:** Separate with commas (no spaces)
- **Example:** `https://lagbe-kichu-frontend.vercel.app,http://localhost:3000`
- **Note:** Add your Vercel URL after frontend is deployed

### 4. JWT Secrets (Critical - Generate Secure Values)

```env
JWT_ACCESS_SECRET=your-secure-access-token-secret-key-here-minimum-32-characters
JWT_REFRESH_SECRET=your-secure-refresh-token-secret-key-here-minimum-32-characters
```
- **Purpose:** Secrets for signing JWT tokens
- **Requirements:** Minimum 32 characters each, random and secure
- **How to generate:**
  ```bash
  # Using OpenSSL
  openssl rand -base64 32
  
  # Generate two different secrets
  openssl rand -base64 32  # For ACCESS_SECRET
  openssl rand -base64 32  # For REFRESH_SECRET
  
  # Or use Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **Example:** 
  ```
  JWT_ACCESS_SECRET=aB3xK9mL2nP8qR5tV1wY4zA7cF0hJ6dN3sG8mQ2pL9vX1
  JWT_REFRESH_SECRET=zY8wV5tR2qP9mL6nJ3fH0dC7aF4gS1kD8jQ5pL2nM9vX6
  ```
- **⚠️ Important:** Never share these secrets or commit them to Git

### 5. Email Configuration (Gmail)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```
- **Purpose:** Email service for password resets and notifications
- **EMAIL_USER:** Your Gmail address
- **EMAIL_PASS:** Gmail App Password (NOT your regular password)
- **How to get App Password:**
  1. Go to Google Account → Security
  2. Enable 2-Step Verification (if not already enabled)
  3. Go to App Passwords
  4. Create new app password for "Mail"
  5. Copy the 16-character password (no spaces)
- **Example:**
  ```
  EMAIL_USER=asifmahmud053@gmail.com
  EMAIL_PASS=abcd efgh ijkl mnop
  ```
  (In Render, enter without spaces: `abcdefghijklmnop`)

### 6. Cloudinary Configuration (Optional but Recommended)

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```
- **Purpose:** Cloud storage for product images and videos
- **How to get:**
  1. Go to [https://cloudinary.com](https://cloudinary.com)
  2. Sign up for free account
  3. Go to Dashboard
  4. Copy Cloud Name, API Key, and API Secret
- **Note:** If not set, file uploads will use local storage (not recommended for production)
- **Alternative:** Leave empty if using local file storage only

## Step-by-Step: Adding to Render

1. **Go to your Render service dashboard**
2. **Click "Environment" tab** (in the left sidebar)
3. **Click "Add Environment Variable"** button
4. **Add each variable:**
   - Enter variable name (e.g., `PORT`)
   - Enter variable value (e.g., `10000`)
   - Click "Save"
5. **Repeat for all variables** listed above
6. **After adding all variables:**
   - Click "Save Changes"
   - Render will automatically redeploy

## Quick Copy-Paste Template

Copy this entire block and replace the placeholder values:

```env
PORT=10000
NODE_ENV=production
BASE_URL=https://your-app-name.onrender.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lagbe-kichu?retryWrites=true&w=majority
CORS_ORIGIN=http://localhost:3000
JWT_ACCESS_SECRET=generate-secure-random-string-minimum-32-characters
JWT_REFRESH_SECRET=generate-another-secure-random-string-minimum-32-characters
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password-16-chars
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Variables to Update After Deployment

After your service is deployed, update these:

1. **BASE_URL:** Set to your actual Render URL
   ```
   BASE_URL=https://lagbe-kichu-backend.onrender.com
   ```

2. **CORS_ORIGIN:** Add your Vercel frontend URL (after frontend is deployed)
   ```
   CORS_ORIGIN=https://your-frontend.vercel.app,http://localhost:3000
   ```

## Security Notes

- ✅ Never commit `.env` files to Git
- ✅ Use strong, random JWT secrets (minimum 32 characters)
- ✅ Use Gmail App Password, not regular password
- ✅ Keep MongoDB credentials secure
- ✅ Rotate secrets periodically in production

## Troubleshooting

### Variables Not Working
- Check spelling and case sensitivity
- Ensure no extra spaces or quotes
- Redeploy after changing variables

### MongoDB Connection Issues
- Verify connection string is correct
- Check MongoDB Atlas Network Access (whitelist IPs)
- Verify username and password are correct

### Email Not Sending
- Ensure 2-Step Verification is enabled on Gmail
- Use App Password, not regular password
- Verify EMAIL_USER and EMAIL_PASS are correct

### JWT Errors
- Ensure both secrets are at least 32 characters
- Verify secrets are different for ACCESS and REFRESH
- Check for typos in secret values

---

**After Deployment:** Update `BASE_URL` and `CORS_ORIGIN` with your actual URLs!

