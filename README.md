# Lagbe Kichu - E-commerce Platform

A full-stack e-commerce web application with three user types: Admin, Seller, and Buyer. Built with modern technologies and production-ready features.

## Project Structure

```
├── backend/          # Express.js backend with TypeScript
├── frontend/         # Next.js 14 frontend with TypeScript
└── README.md
```

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **State Management**: Redux Toolkit with RTK Query
- **Styling**: TailwindCSS
- **Form Handling**: React Hook Form + Zod

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (access and refresh tokens)
- **Validation**: Zod
- **Security**: Helmet.js, Rate Limiting, CORS
- **File Upload**: Multer with Cloudinary support
- **Email**: Nodemailer with Gmail SMTP

## Features

### Admin Portal
- Admin-only login
- Role-based access control
- View all users (buyers/sellers)
- Ban/Suspend user accounts

### Seller Portal
- Authentication & secure session
- Add/Edit/Delete Products (with images and video)
- Order Management (Approve/Reject/Update status)
- Dashboard with stats (optional)

### Buyer Features
- Authentication & secure session
- Browse/Search products
- Product Detail View
- Add to Cart and Checkout (Cash on Delivery)
- Order Tracking
- Leave reviews/ratings (optional)

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/lagbe-kichu
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# CORS (comma-separated for multiple origins in production)
CORS_ORIGIN=http://localhost:3000

# JWT Secrets (Generate secure random strings - minimum 32 characters)
# Use: openssl rand -base64 32 (to generate secure secrets)
JWT_ACCESS_SECRET=your-secure-access-token-secret-key-here
JWT_REFRESH_SECRET=your-secure-refresh-token-secret-key-here

# Email Configuration (for password reset and notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary Configuration (Optional - for image/video uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Environment
NODE_ENV=development
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or cloud)
- npm or yarn package manager
- (Optional) Cloudinary account for image/video uploads
- (Optional) Gmail account with App Password for email notifications

### Installation

1. Clone the repository and navigate to the project directory

2. Install dependencies:

   **Backend:**
   ```bash
   cd backend
   npm install
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm install
   ```

3. Set up environment variables:
   - Create `backend/.env` file (see Backend Environment Variables above)
   - Create `frontend/.env.local` file (see Frontend Environment Variables above)
   - Fill in all required values

4. Create uploads directory for backend:
   ```bash
   mkdir -p backend/uploads
   ```

5. Create admin user:
   ```bash
   cd backend
   npm run create-admin
   ```
   *Follow the prompts to create your admin account.*

6. (Optional) Seed database with sample data:
   ```bash
   cd backend
   npm run seed
   ```
   *This creates sample users (seller, buyer), categories, and products for testing.*

## Test Credentials

After running the seed script (`npm run seed`), you can use the following test accounts:

### Mock Data Accounts (Created by Seed Script)

**Seller Account:**
- **Email:** `seller@example.com`
- **Password:** `seller123`
- **Name:** John Seller
- **Role:** Seller
- **Features:** Can create/edit products, manage orders

**Buyer Account:**
- **Email:** `buyer@example.com`
- **Password:** `buyer123`
- **Name:** Jane Buyer
- **Role:** Buyer
- **Features:** Can browse products, add to cart, place orders


7. Build the backend (for production):
   ```bash
   cd backend
   npm run build
   ```

8. Build the frontend (for production):
   ```bash
   cd frontend
   npm run build
   ```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm start
```

## Security Features

- ✅ Helmet.js security headers (production)
- ✅ Rate limiting on all routes
- ✅ CORS configuration
- ✅ Input validation with Zod
- ✅ File upload validation (MIME types, size limits)
- ✅ JWT authentication with refresh tokens
- ✅ HTTP-only cookies for refresh tokens
- ✅ Environment-based error messages
- ✅ Production logging (errors only)

## Production Deployment

1. **Set Environment Variables:**
   - Set `NODE_ENV=production` in both backend and frontend
   - Configure production MongoDB URI
   - Set production CORS origins
   - Use strong, randomly generated JWT secrets
   - Configure production BASE_URL

2. **Security Checklist:**
   - [ ] Change all default credentials
   - [ ] Use strong JWT secrets (32+ characters)
   - [ ] Configure CORS for production domains only
   - [ ] Enable HTTPS
   - [ ] Set up proper database backups
   - [ ] Configure production logging service
   - [ ] Review rate limit settings

3. **Build Commands:**
   ```bash
   # Backend
   cd backend
   npm run build
   npm start

   # Frontend
   cd frontend
   npm run build
   npm start
   ```

## Rate Limits

- **General API**: 200 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **File Uploads**: 20 requests per 15 minutes

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB URI format
- Check MongoDB Atlas IP whitelist (if using Atlas)
- Ensure network connectivity

### CORS Errors
- Verify `CORS_ORIGIN` includes frontend domain
- Check frontend `NEXT_PUBLIC_API_URL` configuration

### File Upload Failures
- Check file size limits (50MB max)
- Verify file type restrictions
- Check Cloudinary credentials (if using Cloudinary)

### Email Not Sending
- Verify Gmail App Password (not regular password)
- Check email service configuration
- Ensure 2-Step Verification is enabled on Gmail account

## Additional Notes

- All `.env` files should be added to `.gitignore` and never committed to version control
- For production, use environment-specific secrets and credentials
- Regularly update dependencies for security patches
- Monitor rate limiting and adjust as needed based on traffic

## License

Developed by Asif Mahmud

