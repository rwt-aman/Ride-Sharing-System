# Ride Share: Backend

Peer-to-peer ride sharing API for students. Riders post rides, seaters request seats, riders accept or reject.

**Stack:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, zod, Brevo (email), helmet, express-rate-limit.

## Setup
```bash
npm install
cp .env.example .env     # fill in the values
npm run dev              # or: npm start
```
| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 32+ chars. `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CLIENT_URL` | Frontend origin(s) for CORS, comma-separated, no trailing slash |
| `BREVO_API_KEY`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME` | Brevo key and a **verified** sender. Without a key (development only) the OTP is printed to the server console |

The server refuses to start if a required variable is missing.

## Project structure
```
server.js            starts DB + HTTP server
app.js               middleware + route mounting
config/              env validation, DB connection
models/              User, Ride, Booking (Mongoose schemas + indexes)
routes/              URL -> controller wiring
controllers/         request handling and business rules
services/            mailService (Brevo), otpService
middleware/          auth (JWT), validate (zod), errorHandler, rateLimiters
validators/          zod schemas for every request body
utils/               ApiError, asyncHandler, serializers, escapeRegex
```

## API
All routes except `/api/auth/*` need `Authorization: Bearer <token>`. Errors look like `{ "error": "message" }`.

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account, email a 6-digit OTP |
| POST | `/api/auth/verify-otp` | `{ email, otp }`: verify email (5 attempts, 10 min expiry) |
| POST | `/api/auth/resend-otp` | New code (60 s cooldown) |
| POST | `/api/auth/login` | Returns `{ token, user }`; 403 + `requiresVerification` if unverified |
| GET / PUT | `/api/users/me` | Read / update own profile (and password) |
| POST | `/api/rides` | Post a ride |
| GET | `/api/rides?date=YYYY-MM-DD&destination=` | Search rides (excludes your own) |
| GET | `/api/rides/mine` | My posted rides |
| PUT / DELETE | `/api/rides/:id` | Edit / delete (owner only) |
| POST | `/api/bookings` | `{ rideId }`: request a seat |
| GET | `/api/bookings/mine` | Bookings I made |
| GET | `/api/bookings/received` | Requests on my rides |
| PATCH | `/api/bookings/:id` | `{ status: "accepted" \| "rejected" }` (ride owner only) |
| DELETE | `/api/bookings/:id` | Cancel my booking |

Status codes: 200/201 success, 400 validation, 401 not authenticated, 403 not allowed, 404 not found, 409 conflict (no seats, duplicate), 429 rate limited, 502 email provider failed, 500 unexpected.

## How it works
- **Auth:** login returns a JWT (1 day, HS256). Middleware verifies it and sets `req.user`; identity is never read from the body or query. Ownership is enforced server-side (403).
- **Passwords:** bcrypt (10 rounds). Password/OTP fields are `select: false`. Login gives the same error for unknown email and wrong password, with dummy-hash timing equalisation.
- **Email OTP:** `crypto.randomInt` code, stored only as a bcrypt hash, 10-minute expiry, 5 attempts counted atomically, 60 s resend cooldown. Unverified accounts are removed after 24 h (TTL index).
- **Seat safety:** accept = `findOneAndUpdate` claiming the booking from `pending`, then `findOneAndUpdate` on the ride with `seatsAvailable > 0` and `$inc: -1` (rolled back if no seat). Reject/cancel return a seat only if the booking was `accepted`, and only once.
- **Duplicate bookings:** unique index on `(rideId, seaterStudentId)`; a rejected booking is reopened instead of duplicated.
- **Hardening:** helmet, CORS allow-list, rate limits (stricter on auth/OTP), body size limit, escaped regex in search, no internal error details sent to clients.
