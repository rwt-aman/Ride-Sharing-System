# 🚗 Ride Sharing System

A full-stack peer-to-peer ride sharing web application built for students, enabling users to post, search, and book rides within their institution.

**🔗 Live Demo:** [ride-sharing-system.netlify.app](https://ride-sharing-system.netlify.app/)

---

## 📌 Overview

Ride Sharing System is a MERN-inspired web application (Node.js, Express.js, MongoDB, HTML/CSS/JS) that allows students to share rides with each other. Riders can post ride offers, and Seaters can search and book available seats — with secure authentication restricted to verified institutional emails.

---

## ✨ Features

- 🔐 **Secure Authentication** — Password hashing with bcrypt, institutional email restriction (`@gehu.ac.in`)
- 🚘 **Ride Management** — Post, edit, and delete rides (Rider role)
- 🔍 **Ride Search & Booking** — Search rides by destination and date, request bookings (Seater role)
- ✅ **Booking Approval Flow** — Riders can accept or reject incoming booking requests
- 👤 **Profile Management** — Update personal details and change password
- 🌙 **Dark Mode** — Toggle between light and dark themes
- 🔔 **Toast Notifications** — Real-time feedback for user actions
- 📱 **Responsive Design** — Mobile-friendly single page application

---

## 🛠️ Tech Stack

| Layer      | Technology                     |
|------------|---------------------------------|
| Frontend   | HTML, CSS, JavaScript           |
| Backend    | Node.js, Express.js             |
| Database   | MongoDB (Mongoose ODM)          |
| Auth       | bcrypt (password hashing)       |
| Deployment | Netlify (Frontend), Render/Railway (Backend) |

---

## 📂 Project Structure

```
ride-sharing-system/
├── index.js              # Express server & API routes
├── package.json
├── .env                  # Environment variables (not committed)
├── .gitignore
└── public/                # Frontend files (HTML/CSS/JS)
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v16 or higher)
- A MongoDB Atlas account (or local MongoDB instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ride-sharing-system.git
   cd ride-sharing-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```
   MONGO_URI=your_mongodb_connection_string
   PORT=3000
   ```

4. **Run the server**
   ```bash
   node index.js
   ```

   Server will start at `http://localhost:3000`

---

## 🔌 API Endpoints

| Method | Endpoint             | Description                          |
|--------|-----------------------|---------------------------------------|
| POST   | `/register`           | Register a new user                   |
| POST   | `/login`               | Authenticate a user                   |
| POST   | `/post-ride`           | Create a new ride                     |
| POST   | `/edit-ride`           | Edit an existing ride                 |
| POST   | `/delete-ride`         | Delete a ride                         |
| GET    | `/my-rides`             | Get rides posted by a user            |
| GET    | `/search-rides`         | Search available rides                |
| POST   | `/confirm-booking`     | Request a booking on a ride           |
| GET    | `/rider-bookings`       | Get booking requests for a rider      |
| POST   | `/accept-booking`      | Accept a booking request              |
| POST   | `/reject-booking`      | Reject a booking request              |
| POST   | `/cancel-booking`      | Cancel a booking                      |
| GET    | `/seater-bookings`      | Get bookings made by a seater         |
| GET    | `/profile`              | Get user profile details              |
| POST   | `/update-profile`      | Update user profile / password        |

---

## 🚀 Deployment

- **Frontend:** Deployed on [Netlify](https://ride-sharing-system.netlify.app/)
- **Backend:** Deployed on [Render]*
- **Database:** MongoDB Atlas (cloud-hosted)

---

## 🔮 Future Improvements

- JWT-based authentication and route-level authorization
- Real-time notifications using WebSockets
- Rating and review system for riders/seaters
- In-app chat between matched riders and seaters

---

## 👤 Author

**Aman Rawat**
B.Tech in Computer Science & Engineering, Graphic Era Hill University.

---
