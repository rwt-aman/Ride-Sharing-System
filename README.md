# 🚗 Ride Sharing System

A full-stack, peer-to-peer campus ride sharing web application built with **React + Vite** and a modular **Node.js / Express / Mongoose** REST backend. Riders offer seats on upcoming journeys, seaters discover and reserve empty seats, and seat counts are managed with race-condition-free atomic updates.

---

### 🌐 Live Demo

- **🔗 Live Application**: [https://ride-sharing-system.netlify.app/](https://ride-sharing-system.netlify.app/)

---

## ⚡ Features

- **✉️ Cryptographic Email Verification**: Account ownership is validated via 6-digit one-time passcodes (OTP) dispatched using Brevo's HTTP API. Passcodes are securely hashed in the database with strict attempt caps and cooldowns.
- **🚘 Dual Roles**:
  - **Rider (Driver)**: Post rides with source gate, destination, departure date/time, seat count, and notes; manage booking requests (Accept / Reject) with atomic seat allocation; edit and delete posted rides.
  - **Seater (Passenger)**: Search upcoming rides by date and destination; request seat reservations; view request status (Pending / Accepted / Rejected); cancel bookings with automated seat restoration.
- **🛡️ Race-Condition-Proof Bookings**:
  - Atomic MongoDB queries (`findOneAndUpdate`, `$inc`) prevent negative seat availability even during simultaneous booking acceptance requests.
  - Unique composite index `(rideId, seaterStudentId)` prevents duplicate bookings.
  - Rejection or cancellation of accepted bookings restores seats idempotently without double-counting.
- **👤 Profile Management**: View profile details and update name, phone, or password (protected by current password verification).
- **🌓 Dynamic UI & Design System**: Responsive layout with persistent dark mode, live status badges, custom time picker, and floating toast notifications.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Custom Vanilla CSS Design System, Context API (`AuthContext`, `ToastContext`) |
| **Backend** | Node.js (>= 18), Express 5, MongoDB Atlas (Mongoose 9) |
| **Validation & Security** | Zod schemas, Bcrypt password & OTP hashing, JSON Web Tokens (JWT), Helmet, Express-Rate-Limit 8 |
| **Email Service** | Brevo HTTP API (Transactional Mail) |

---

## 📁 Repository Structure

```text
Ride_sharing/
├── backend/
│   ├── server.js            # Boots MongoDB connection & starts HTTP server
│   ├── app.js               # Express application, middleware & route mounting
│   ├── config/              # Environment parsing (config/env.js) & DB connection (config/db.js)
│   ├── models/              # Mongoose schemas & indexes (User, Ride, Booking)
│   ├── routes/              # Route definitions (authRoutes, userRoutes, rideRoutes, bookingRoutes)
│   ├── controllers/         # Business logic and request handlers
│   ├── services/            # mailService (Brevo API) & otpService (OTP generation & hashing)
│   ├── middleware/          # auth (JWT), validate (Zod), errorHandler, rateLimiters
│   ├── validators/          # Centralized Zod validation schemas
│   ├── utils/               # ApiError, asyncHandler, serializers, escapeRegex
│   ├── .env.example         # Backend environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/index.js     # Centralized API fetch layer with 401 interceptor
│   │   ├── context/         # AuthContext & ToastContext providers
│   │   ├── components/      # UI components (DarkToggle, Icons, AuthShowcase)
│   │   ├── pages/           # Pages (LoginPage, RegisterPage, OtpPage, DashboardPage, RiderView, SeaterView, ProfileModal)
│   │   ├── index.css        # Handcrafted design system and theme styles
│   │   ├── App.jsx          # Top-level router and layout
│   │   └── main.jsx         # Application entry point
│   ├── .env.example         # Frontend environment variables template
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## ⚙️ Setup & Configuration

### 1. Backend Environment Variables

In `backend/`, copy `.env.example` to `.env`:
```bash
cp backend/.env.example backend/.env
```

Configure the following variables in `backend/.env`:

| Variable | Purpose | How to Obtain / Configure |
|---|---|---|
| `NODE_ENV` | Environment mode (`development` or `production`) | Set to `development` locally. |
| `PORT` | Local backend HTTP port | Default: `3000`. |
| `MONGO_URI` | MongoDB Atlas connection string | Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), create a database user, and copy the SRV connection URI (`mongodb+srv://...`). |
| `JWT_SECRET` | Secret key for signing HS256 auth tokens | Generate a random 32+ character string: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CLIENT_URL` | Allowed frontend origin(s) for CORS | Set to `http://localhost:5173` for local development. |
| `BREVO_API_KEY` | API Key for Brevo email dispatch | Sign up at [Brevo](https://app.brevo.com), navigate to **SMTP & API -> API Keys**, and create a new key. *(Optional in dev: if omitted, OTP codes are logged directly to the backend console).* |
| `MAIL_FROM_EMAIL` | Verified sender email address | In your Brevo dashboard under **Senders, Domains & Dedicated IPs -> Senders**, add and verify your sender email. |
| `MAIL_FROM_NAME` | Sender display name | Example: `Ride Share` |

### 2. Frontend Environment Variables

In `frontend/`, copy `.env.example` to `.env`:
```bash
cp frontend/.env.example frontend/.env
```

| Variable | Purpose | Value |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` (development) or your deployed production backend URL |

---

## 🚀 Running Locally

### Backend
```bash
cd backend
npm install
npm run dev    # runs node --watch server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev    # starts Vite development server at http://localhost:5173
```

---

## 🔌 API Endpoints Reference

All endpoints (except `/api/auth/*`) require an `Authorization: Bearer <token>` header. Responses follow standard JSON shapes; errors always return `{ "error": "message" }`.

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register user (`studentId`, `fullName`, `phoneNumber`, `email`, `password`). Issues 6-digit OTP. |
| `POST` | `/api/auth/verify-otp` | Verify email with OTP (`email`, `otp`). Max 5 attempts; 10-minute expiry. |
| `POST` | `/api/auth/resend-otp` | Request a new OTP (`email`). Enforces a 60-second cooldown. |
| `POST` | `/api/auth/login` | Login with `email` and `password`. Returns `{ token, user }`; returns `403` with `requiresVerification: true` if unverified. |

### User Profile (`/api/users`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/me` | Retrieve profile of the authenticated user. |
| `PUT` | `/api/users/me` | Update name, phone, or password (password change requires `currentPassword`). |

### Rides (`/api/rides`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/rides` | Post a ride offer (`source`, `destination`, `leaveDate`, `leaveTime`, `seatsAvailable`, `note`). |
| `GET` | `/api/rides?date=YYYY-MM-DD&destination=` | Search available rides (automatically excludes caller's own rides). |
| `GET` | `/api/rides/mine` | List rides created by authenticated user. |
| `PUT` | `/api/rides/:id` | Update ride details (owner only). |
| `DELETE` | `/api/rides/:id` | Delete ride and cascade-delete associated bookings within a MongoDB transaction. |

### Bookings (`/api/bookings`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/bookings` | Book a seat (`rideId`). |
| `GET` | `/api/bookings/mine` | Retrieve bookings made by caller as passenger. |
| `GET` | `/api/bookings/received` | Retrieve incoming booking requests for rides posted by caller. |
| `PATCH` | `/api/bookings/:id` | Accept or reject a booking (`{ "status": "accepted" \| "rejected" }`). |
| `DELETE` | `/api/bookings/:id` | Cancel passenger booking with automatic seat restoration. |

---

## 🔒 Security & Concurrency Design

### 1. JWT Authentication & Timing-Safe Login
- Bearer tokens signed with HS256 algorithm and 1-day expiry.
- To prevent user enumeration attacks via response timing, the login controller runs `bcrypt.compare` against a precomputed dummy hash when an email is not found, ensuring uniform response times for unknown emails and wrong passwords.

### 2. OTP Lifecycle & Defense in Depth
- **Cryptographic Generation**: Uses `crypto.randomInt` rather than `Math.random` to generate unbiased 6-digit codes.
- **Zero Raw Code Storage**: The database only stores a 10-round bcrypt hash of the OTP (`otp` with `select: false`), preventing code leakage if database dumps are accessed.
- **Atomic Rate Limiting**: Verification attempts are incremented atomically via `findOneAndUpdate` before checking the hash, preventing brute-force race conditions. Max 5 attempts allowed.
- **TTL Index Cleanup**: Unverified registration documents are automatically dropped by MongoDB after 24 hours via a partial TTL index (`expireAfterSeconds: 86400, isVerified: false`).

### 3. Atomic Seat Allocation
- Accepts utilize a two-step atomic sequence:
  1. Claim booking transition from `pending` to `accepted` via `Booking.findOneAndUpdate({ _id, status: "pending" }, { status: "accepted" })`.
  2. Decrement available seats via `Ride.findOneAndUpdate({ _id, seatsAvailable: { $gt: 0 } }, { $inc: { seatsAvailable: -1 } })`. If no seats remain, the booking is automatically rolled back to `pending`.
- Rejections and cancellations atomically check the previous status to increment seats (`$inc: { seatsAvailable: 1 }`) only if the booking was previously `accepted`, ensuring idempotency and preventing seat duplication.
