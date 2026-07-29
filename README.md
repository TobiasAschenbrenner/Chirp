# Chirp 🐦

Chirp is a social media–style web application inspired by platforms like Twitter/X.  
It allows users to share short posts, interact with others, and manage personal profiles.

---

## 🌍 Live Demo

A live version of the application is available at:  
👉 https://chirp.blog

---

## ✨ Features

- Register, log in, log out, and automatically renew expired access tokens
- Create, edit, and delete posts
- Comment on posts
- Like and bookmark posts
- Follow and unfollow users
- User profiles with bio and profile picture
- Image uploads via Cloudinary
- Responsive frontend

---

## 🛠 Tech Stack

### Frontend

- Angular
- TypeScript
- SCSS
- RxJS
- Vitest

### Backend

- Node.js
- Express
- MongoDB (Mongoose)
- Cloudinary (image uploads)
- Node.js built-in test runner

### Development and Deployment

- ESLint
- GitHub Actions
- Hostinger static hosting and VPS

---

## 📁 Project Structure

```bash
chirp/
├── client/                 # Angular frontend
├── server/                 # Express API, data models and seed script
├── CLEAN_CODE.md           # Clean Code principles and refactoring evidence
└── THREAT_MODEL.md         # Security threat model and implemented controls
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v24+ recommended)
- npm
- MongoDB Atlas account
- Cloudinary account

---

## 🔧 Environment Variables

The backend requires a `.env` file inside the `server` folder.
This file is **ignored by Git** and must be created manually.

### `server/.env`

```bash
PORT=3000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## ▶️ Running the Application

### Backend

```bash
cd server
npm install
npm run dev
```

Backend runs on:
👉 http://localhost:3000

---

### Frontend

```bash
cd client
npm install
npm start
```

Frontend runs on:
👉 http://localhost:4200

---

## 🧪 Running Tests and Quality Checks

Backend tests and checks are executed from the `server` folder:

```bash
npm run lint
npm test
```

Frontend tests and checks are executed from the `client` folder:

```bash
npm run lint
npm test -- --watch=false
npm run build
```

GitHub Actions runs these lint, test, build, and dependency-audit checks for pull requests and changes to `main`.

---

## 🔐 Security Considerations

The backend uses short-lived JWT access tokens, rotating refresh sessions, password hashing, request validation, authorization checks, rate limiting, restricted CORS, security headers and file-upload restrictions.

The STRIDE analysis, implemented controls, and remaining risks are documented in [THREAT_MODEL.md](./THREAT_MODEL.md).

---

## Data Model

Chirp uses MongoDB collections for users, posts, comments, and refresh sessions. References are used for relationships such as post creators, followers, likes, bookmarks, and comments.

<img width="1966" height="1059" alt="Chirp Data Model" src="https://github.com/user-attachments/assets/474daa88-5a61-4e2c-b74f-0039ef1127fc" />

---

## 📊 Data

The database was populated using a custom **seed script** that generates realistic demo data.

The generated dataset contains:

- 50 users
- 500 posts
- 2,500 comments

This dataset was used to validate the NoSQL data model and query patterns.

From the `server` directory, run:

```bash
node scripts/seed.js
```

> [!WARNING]
> The seed script deletes all existing users, posts, and comments in the configured database
> before inserting the demo data. Use it only with a disposable development database.

---

## 🧹 Clean Code

The applied Clean Code principles, refactoring workflow, automated checks, and remaining
limitations are documented in [CLEAN_CODE.md](./CLEAN_CODE.md).

---

## 🎓 Project Context

This application was built as a **university project** to learn about:

- Full-stack development with Angular, Express, and MongoDB
- NoSQL data modelling and query patterns
- Clean Code principles, testing, and maintainability
- Threat modelling and web-application security

---

## 🤖 Use of AI Tools

AI tools were used as supporting tools for code completion, discussing architecture and refactoring options, understanding errors, and reasoning about the database and security model. They were also used to help structure parts of the project documentation. All implementation decisions, code integration, and final validation were performed by the author.
