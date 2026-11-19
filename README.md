# SalonBook — Luxury Atelier & Wellness Management Platform (Server)

Enterprise-grade RESTful API backend engineered for **SalonBook**, a high-end luxury salon, spa, and wellness appointment management platform. Built with Node.js, Express, TypeScript, MongoDB Atlas, Stripe API, and ImgBB Cloud Services.

---

## 1. Project Name and Description

- **Project Name:** SalonBook API Server (`salonbook-server`)
- **Description:** SalonBook Server powers a modern atelier management ecosystem. It provides mission-critical services including role-based authentication (Admin & Patron), cryptographic JWT session governance, dynamic treatment carte curation, real-time appointment scheduling, patron access suspension (block/unblock), live Stripe payment checkout with webhook verification, automated digital invoice generation, and financial ledger telemetry.

---

## 2. Important Features

- **Robust Role-Based Authentication & Authorization (RBAC):**
  - Secure credential registration and login with bcrypt password hashing.
  - Google OAuth 2.0 token verification for instant patron onboarding.
  - Strict administrative role enforcement on carte creation, scheduling approvals, and user governance.
- **Client & Patron Directory Governance:**
  - Administrative oversight of all registered patrons with deep-dive dossier inspection.
  - Instant patron suspension (Block User) which immediately cuts off protected routes and booking privileges.
  - Patron reinstatement (Unblock User) restoring chair booking capabilities.
- **Atelier Carte & Service Management:**
  - Full CRUD operations on luxury salon treatments and formulations.
  - Multi-part image uploading directly to ImgBB cloud storage (strictly file upload, not raw URL inputs).
  - Validation enforcing positive pricing (`price > 0`) and positive duration (`durationMinutes > 0`).
  - Active/Inactive status toggle to archive or publish treatments.
- **Intelligent Appointment Scheduling & Reservation Diary:**
  - Real-time slot conflict prevention ensuring no double-booking for the same specialist or time slot.
  - Default initial state: `Pending` appointment status and `Unpaid` payment status.
  - Strict rule enforcement: Only `Pending` appointments can be confirmed by Admin.
  - Admin authority to cancel either `Pending` or `Confirmed` appointments with timestamp auditing.
  - Customer self-cancellation restricted strictly to their own `Pending` requests.
  - Ubiquitous record deletion with cascading referential integrity.
- **Stripe Payment Gateway & Financial Audit Ledger:**
  - Stripe Checkout Session creation with dynamic pricing per treatment.
  - Stripe Webhook listener verifying cryptographic signatures (`whsec_...`) to transition payment status to `Paid`.
  - Transaction log recording Stripe Session IDs, customer references, settled amounts, and auto-generated tax invoices (`INV-YYYY-XXXXX`).

---

## 3. Technology Stack

- **Runtime & Framework:** Node.js (v18+), Express.js
- **Language:** TypeScript (Strict Mode)
- **Database & ODM:** MongoDB Atlas, Mongoose
- **Security & Middleware:** Helmet, CORS, Express Rate Limit, Morgan, JSON Web Tokens (JWT), Bcrypt.js
- **Validation:** Zod schema validation
- **Cloud & Third-Party APIs:**
  - Stripe SDK & Stripe Webhooks (Checkout Sessions, TLS 256-bit encryption)
  - ImgBB API (Multipart file upload via Multer memory storage)
  - Google OAuth2 Client (`google-auth-library`)

---

## 4. Installation Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tuhin-2006/salonbook-server.git
   cd salonbook-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of `salonbook-server` based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

---

## 5. How to Run the Project Locally

- **Development Mode (with auto-reload via tsx):**
  ```bash
  npm run dev
  ```
  The API will be operational at `http://localhost:5000/api/v1`.

- **Production Build & Execution:**
  ```bash
  npm run build
  npm start
  ```

- **Database Seeding (Optional for initial data):**
  ```bash
  npx tsx src/scripts/seed.ts
  ```

---

## 6. Required Environment Variables

> **Note:** Only variable names are documented below. Strictly never commit actual secret keys or credentials to version control.

| Environment Variable | Description |
|---|---|
| `PORT` | Local network port for the Express server (e.g., `5000`) |
| `NODE_ENV` | Application environment mode (`development` or `production`) |
| `CLIENT_URL` | Allowed frontend origin for CORS policies |
| `DATABASE_URL` | MongoDB Atlas connection string URI |
| `JWT_SECRET` | Secret key used for signing and verifying JSON Web Tokens |
| `JWT_EXPIRES_IN` | Token expiration duration (e.g., `7d`) |
| `STRIPE_SECRET_KEY` | Stripe secret API key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint cryptographic signing secret (`whsec_...`) |
| `STRIPE_CURRENCY` | Default billing currency code (e.g., `usd`) |
| `IMGBB_API_KEY` | API key for ImgBB cloud photography hosting |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth 2.0 Web Client ID |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth 2.0 Web Client Secret |

---

## 7. Live Website Link

- **Live Production Application:** [https://salonbook-client-two.vercel.app](https://salonbook-client-two.vercel.app)
- **Live API Base Endpoint:** [https://salonbook-server-omega.vercel.app/api/v1](https://salonbook-server-omega.vercel.app/api/v1)

---

## 8. Client and Server Repository Links

- **Client Repository:** [https://github.com/tuhin-2006/salonbook-client](https://github.com/tuhin-2006/salonbook-client)
- **Server Repository:** [https://github.com/tuhin-2006/salonbook-server](https://github.com/tuhin-2006/salonbook-server)
