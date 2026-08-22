# Servora

**Service Made Simple** — an on-demand service platform for university students.
Students request Water, Laundry, Gas, or Repairs; Servora matches them with a
local provider and takes a commission. Roles: **Student**, **Provider**, **Admin**.

## Stack

- **Frontend:** React 18 + Vite, Tailwind CSS, lucide-react, single `api.js` for all fetch calls
- **Backend:** Node.js + Express (ESM), JWT auth (jsonwebtoken + bcryptjs), Multer → Cloudinary uploads, Resend emails
- **Database:** PostgreSQL (Neon), `schema.sql` + `seed.js`
- **Payments:** Paystack (public key on client, secret key verified server-side)
- **Deployment:** single Render web service — Express serves the built React app and the `/api` routes

## Project layout

```
servora/
├── server/
│   ├── index.js            # Express app entry point
│   ├── db.js                # pg Pool + query helper
│   ├── store/                # SQL access, one file per domain
│   │   ├── userStore.js
│   │   ├── providerStore.js
│   │   └── orderStore.js
│   ├── middleware/
│   │   ├── auth.js           # JWT sign/verify + role guard
│   │   └── upload.js         # Multer memory storage
│   ├── utils/
│   │   ├── cloudinary.js
│   │   ├── email.js          # Resend
│   │   └── paystack.js
│   └── routes/
│       ├── health.routes.js
│       ├── auth.routes.js
│       ├── user.routes.js
│       ├── provider.routes.js
│       ├── order.routes.js
│       ├── payment.routes.js
│       ├── admin.routes.js
│       └── support.routes.js
├── client/                   # React + Vite + Tailwind
│   └── src/
│       ├── api.js            # every frontend → backend call
│       ├── App.jsx
│       ├── context/AuthContext.jsx
│       └── pages/
├── schema.sql
├── seed.js
├── render.yaml
├── .env.example
└── package.json
```

## Local setup

1. **Database.** Create a Neon Postgres project, copy the connection string into `.env` as `DATABASE_URL`, then run:
   ```bash
   psql "$DATABASE_URL" -f schema.sql
   ```
2. **Server env.** `cp .env.example .env` and fill in JWT secret, Cloudinary, Resend, and Paystack keys.
3. **Client env.** `cp client/.env.example client/.env` and set `VITE_PAYSTACK_PUBLIC_KEY`.
4. **Install deps** (root + client):
   ```bash
   npm install
   npm install --prefix client
   ```
5. **Seed the admin user:**
   ```bash
   npm run seed
   ```
6. **Run in dev.** Either one command that runs both:
   ```bash
   npm run dev:all          # Express API on :4000 + Vite dev server on :5173, together
   ```
   ...or two separate terminals if you'd rather see their logs apart:
   ```bash
   npm run dev               # Express API on :4000
   npm run dev:client        # Vite dev server on :5173 (proxies /api to :4000)
   ```

## Production build (what Render runs)

```bash
npm run build   # installs + builds client into client/dist
npm start        # Express serves client/dist AND /api/*
```

`server/index.js` serves the compiled React app as static files and falls back
to `index.html` for any non-`/api` route, so the whole thing runs as **one**
Render web service — see `render.yaml`.

## What's scaffolded vs. what's next

Scaffolded now: auth (register/login/verify/reset), user profile + avatar
upload, provider profile/availability/orders, service request creation with
photo upload and simple location-based matching, order tracking, pricing,
reviews, Paystack init/verify/webhook, support tickets, and an admin overview
+ provider/order/ticket management API. The client has the routing shell,
auth context, and `api.js` wired to all of it, plus a placeholder home page
confirming the API/DB connection.

Not yet built (next iterations): the actual request-flow screens per service
type (Water/Laundry/Gas/Repairs forms), provider dashboard UI, admin
dashboard UI, in-app messaging UI (the `messages` table exists, no routes/UI
yet), and push notifications. We'll build these one at a time from here.
