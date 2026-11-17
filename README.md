# SalonBook API Server

Enterprise-grade REST API backend for **SalonBook**, a luxury salon booking and appointment management SaaS platform.

## Tech Stack

- **Runtime & Framework:** Node.js, Express.js
- **Language:** TypeScript (Strict mode)
- **Database & ODM:** MongoDB Atlas, Mongoose
- **Authentication & Authorization:** Better Auth, JWT verification middleware, Role-Based Access Control (RBAC)
- **Payments:** Stripe SDK, Stripe Webhooks (Raw body signature verification)
- **Image Storage:** ImgBB API
- **Validation & Security:** Zod, Helmet, CORS, Express Rate Limit, Centralized Error Handling

## Architecture & Database Collections

Strict 4-collection MongoDB architecture:
1. `users` — Customer and Admin accounts, security flags, profile data
2. `services` — Salon services catalog, pricing, duration, categories, and imagery
3. `appointments` — Booking records, time-slots, customer/service references, status
4. `transactions` — Financial audit log with Stripe session and intent references

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB instance (Local or Atlas)
- Stripe Account (Test keys)
- ImgBB API Key

### Installation

```bash
npm install
```

### Environment Configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

### Development

```bash
npm run dev
```

### Build & Production

```bash
npm run build
npm start
```

## API Documentation

- `POST /api/v1/auth/register` - Customer registration
- `POST /api/v1/auth/login` - User login & JWT issuance
- `GET /api/v1/services` - Public service catalog
- `POST /api/v1/appointments/book` - Book appointment & initiate checkout
- `POST /api/v1/payments/webhook` - Cryptographically signed Stripe webhook listener
