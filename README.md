# 🚗 Ride Share — Campus Mobility System

A full-stack peer-to-peer ride sharing web application built for students, enabling users to post, search, and book rides within their institution.

---

### 🌐 Live Demo & Testing

- **🔗 Live Application**: [https://ride-sharing-system.netlify.app/](https://ride-sharing-system.netlify.app/)
- **🔑 Demo Login Credentials**:
  - **Email**: `demo@gehu.ac.in`
  - **Password**: `demo123`

---

## 📁 Project Architecture

```text
Ride_sharing/
├── backend/
│   ├── index.js          # Express.js REST API & MongoDB models
│   ├── package.json      # Backend dependencies & scripts
│   └── .env.example      # Environment variable template
├── frontend/
│   ├── index.html        # Semantic HTML5 frontend layout
│   ├── style.css         # Modern, responsive handcrafted design system
│   └── app.js            # Client logic, authentication & API bindings
├── .gitignore            # Git exclusion rules (node_modules, .env, OS files)
└── README.md             # Project documentation
```

---

## ⚡ Features

- **🔐 Secure Campus Authentication**: Registration and login restricted to institutional emails (`@gehu.ac.in`) with bcrypt password hashing.
- **🚘 Dual Roles**:
  - **Rider (Driver)**: Post rides with source gate, destination, departure date/time, seat count, and notes; manage booking requests (Accept / Reject); edit and delete posted rides.
  - **Seater (Passenger)**: Search rides by date and destination; send booking requests; track booking status (Pending / Accepted / Rejected); cancel bookings with automatic seat restoration.
- **👤 Profile Management**: View profile details, joined date, and update name, phone, or password.
- **🌓 Dark Mode**: Persistent dark mode with smooth theme transitions.
- **🔔 Live Toast Notifications**: Floating toast notification stack with real-time feedback.
- **📱 Mobile-First Responsive**: Fully optimized layout for mobile, tablet, and desktop viewports.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Security** | Bcrypt password hashing, CORS protection |
| **Deployment** | Netlify (Frontend), Render (Backend) |

---

## ⚙️ Getting Started

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```

### 2. Frontend Setup

Open `frontend/index.html` directly in your browser or run via a local web server (e.g., Live Server).

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register a new student account |
| `POST` | `/login` | Authenticate student credentials |
| `POST` | `/post-ride` | Create a new ride offer |
| `POST` | `/edit-ride` | Modify existing ride details |
| `POST` | `/delete-ride` | Cancel / delete a ride |
| `GET` | `/my-rides` | Fetch rides created by the user |
| `GET` | `/search-rides` | Search available rides by destination & date |
| `POST` | `/confirm-booking` | Submit a ride booking request |
| `GET` | `/rider-bookings` | Retrieve booking requests for driver |
| `POST` | `/accept-booking` | Accept a passenger booking request |
| `POST` | `/reject-booking` | Reject a passenger booking request |
| `POST` | `/cancel-booking` | Cancel a booking request / seat reservation |
| `GET` | `/seater-bookings` | Retrieve bookings made by passenger |
| `GET` | `/profile` | Fetch user profile information |
| `POST` | `/update-profile` | Update profile information / password |

---

## 👤 Author

**Aman Rawat**  
B.Tech in Computer Science & Engineering, Graphic Era Hill University.
