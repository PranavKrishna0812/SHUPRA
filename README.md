# Shupra 3D — Full-Scale E-Commerce & Custom 3D Printing Platform

A production-ready, full-stack 3D printing and sacred art e-commerce platform built for deployment on **Vercel** with serverless backend API endpoints and a persistent customer & purchase history database.

---

## 🚀 Key Features

- **Full-Scale Vercel Serverless Architecture:**
  - Zero-configuration deployment with `vercel.json`.
  - Serverless functions under `/api/*` for health checks, OTP authentication, order booking, customer management, and reviews.
  - Dual-mode database layer: Seamlessly runs on **PostgreSQL** (Vercel Postgres, Neon, Supabase) via `POSTGRES_URL` / `DATABASE_URL` with automatic table creation, with local file persistence fallback.

- **Customer Database & Purchase History:**
  - Every customer is registered by their verified 10-digit phone number.
  - Automatically computes lifetime order count and cumulative spend (₹ INR).
  - Customers can view their complete purchase history and active print jobs directly in the store.
  - 1-click order tracking by Order ID (`SHP-XXXXX`).

- **Admin & Print Queue Portal (`/admin`):**
  - Real-time business KPIs: Total Customers, Total Orders, Lifetime Revenue, Active Production Queue, Average Customer Rating.
  - Order Management: Change status between `ORDER_PLACED`, `IN_PRODUCTION`, `QUALITY_CHECK`, `DISPATCHED`, `DELIVERED`.
  - Customer Database: View all registered buyers, order counts, and lifetime value.
  - Direct Customer History inspector modal.
  - Live system health and database latency monitor.
  - Export orders and customers to CSV.

- **3D Studio Configurator & Slicing:**
  - In-browser interactive 3D model viewer & slicing estimator.
  - Multi-material pricing (Matte, Silk, Composite, Stone PLA).
  - Matches 3D model project files directly into the print queue.

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend and database health check, uptime, latency |
| `POST` | `/api/auth/otp` | Mobile OTP authentication (`request` or `verify`) |
| `GET`, `POST`, `PATCH` | `/api/orders` | Place orders, search by customer phone or Order ID, update status |
| `GET`, `POST` | `/api/customers` | Query customer profile and purchase history (`?phone=...`) |
| `GET`, `POST` | `/api/feedback` | Submit and retrieve customer reviews and ratings |
| `GET`, `PATCH` | `/api/admin` | Comprehensive admin dashboard statistics and updates |

---

## 📦 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run integration test suite:**
   ```bash
   npm test
   ```

3. **Start local development server:**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
   - Storefront: `http://localhost:3000`
   - Collection: `http://localhost:3000/collection`
   - Admin Portal: `http://localhost:3000/admin`
   - Health Check: `http://localhost:3000/api/health`

---

## 🌐 Deploy to Vercel

### Option 1: Automatic GitHub Deployment (Recommended)
1. Push this repository to GitHub: `https://github.com/PranavKrishna0812/SHUPRA`
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import the `SHUPRA` repository.
4. (Optional) In **Settings > Environment Variables**, add your database connection:
   - `POSTGRES_URL` or `DATABASE_URL` (from Vercel Postgres, Neon, or Supabase).
   *Note: Even without environment variables, the backend automatically operates with fallback persistence.*
5. Click **Deploy**. Vercel will build and deploy the complete full-stack website in under 60 seconds!

---

## 🔒 Security & Performance
- Built-in CORS protection and security headers (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`).
- Serverless scaling on Vercel's global edge network.
