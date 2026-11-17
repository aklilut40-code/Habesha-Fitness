<div align="center">

  # 🏋️‍♂️ Habesha Fitness — Full-Stack Gym Management System

  <p align="center">
    <strong>A modern, enterprise-grade gym management platform with a React 19 frontend and a PostgreSQL-backed REST API.</strong>
  </p>

  <p align="center">
    <a href="#-key-features">Key Features</a> •
    <a href="#-screenshots--ui-preview">UI Preview</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-database-architecture">Database</a> •
    <a href="#-api-endpoints">API Reference</a> •
    <a href="#-multilingual-support">Multilingual</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
  </p>

</div>

---

## 🌟 Overview

**Habesha Fitness** is an all-in-one gym administration and member experience platform. It combines a sleek, responsive dark-mode web application with a robust Node.js backend connected to a live PostgreSQL relational database. 

It handles everything from member onboarding and plan subscriptions to attendance tracking, staff management, payment recording, and intelligent multilingual customer assistance.

---

## 📸 Screenshots & UI Preview

<div align="center">
  <table>
    <tr>
      <td width="50%" align="center">
        <b>🏋️‍♂️ Fitness & Strength Programs</b><br><br>
        <img src="habesha-fitness/src/assets/images/fitness.jpg" alt="Fitness Training" width="100%" style="border-radius: 8px;" />
      </td>
      <td width="50%" align="center">
        <b>💪 Personal Training & Coaching</b><br><br>
        <img src="habesha-fitness/src/assets/images/training.jpg" alt="Personal Training" width="100%" style="border-radius: 8px;" />
      </td>
    </tr>
    <tr>
      <td width="50%" align="center">
        <b>🔥 High-Energy Workouts</b><br><br>
        <img src="habesha-fitness/src/assets/images/workout.jpg" alt="Workout Sessions" width="100%" style="border-radius: 8px;" />
      </td>
      <td width="50%" align="center">
        <b>🏆 Modern Gym Community</b><br><br>
        <img src="habesha-fitness/src/assets/images/hero.jpg" alt="Hero Gym Experience" width="100%" style="border-radius: 8px;" />
      </td>
    </tr>
  </table>
</div>

---

## ✨ Key Features

### 👤 Member & Subscription Lifecycle
- **Complete CRUD Operations:** Add, update, view, and delete members with live PostgreSQL persistence.
- **Plan Subscriptions:** Assign Basic, Standard, or Premium plans with automatic expiry calculations.
- **Smart Status Tracking:** Real-time badges for `Active`, `Pending`, and `Expired` memberships.

### ⏱️ Attendance & Real-Time Check-In
- **Fast Member Check-In:** Instant check-in/check-out tracking.
- **Constraint Enforcement:** Database-level uniqueness ensures a member cannot check in twice simultaneously.
- **Duration Logging:** Automatically computes time spent on the gym floor.

### 💳 Financial & Payments Management
- **Transaction Logs:** Records for Cash, Card, Mobile Money, and Bank Transfers.
- **Historical Records:** Payment histories are safely retained even if a member profile is archived.

### 🤖 Multilingual AI Chat Assistant
- **Trilingual Assistance:** Full support for **English**, **አማርኛ (Amharic)**, and **ትግርኛ (Tigrinya)**.
- **Gym Knowledgebase:** Built-in exact answers for gym hours, pricing, trainers, and locations.
- **Optional AI Brain:** Plugs into OpenAI (ChatGPT), Anthropic (Claude), or Gemini for fitness and nutrition Q&A.

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend UI** | **React 19**, **Vite 6**, CSS3 Modules, SVG Iconography, Canvas Charts |
| **Backend API** | **Node.js 20+** (ES Modules), Native HTTP, RESTful Architecture |
| **Database** | **PostgreSQL 14–18**, Native `pg` Pool, Relational Constraints, Indexing |
| **Security** | Scrypt Password Hashing, Session Token Hashes, Rate Limiting, Parameterized SQL |
| **Testing** | Node Native Test Runner (`node --test`), Automated End-to-End API Checks |

</div>

---

## 🏛️ Project Architecture

```
habesha-fitness-complete/
├── habesha-fitness/                  # 🌐 React 19 Frontend Web Application
│   ├── src/
│   │   ├── assets/images/            # High-resolution gym imagery
│   │   ├── chat/                     # Local knowledge base & AI bridge
│   │   ├── components/               # Reusable UI components, tables, charts
│   │   ├── i18n/                     # English, Amharic, & Tigrinya dictionaries
│   │   ├── pages/                    # Dashboard, Members, Payments, Attendance, etc.
│   │   ├── store/                    # Live PostgreSQL DataContext & AuthContext
│   │   └── utils/api.js              # Centralized backend HTTP client
│   ├── .env.example                  # Frontend environment configuration template
│   └── package.json
│
├── habesha-fitness-backend/          # ⚙️ Node.js + PostgreSQL Backend API
│   ├── src/
│   │   ├── routes/                   # auth.js, data.js, chat.js
│   │   ├── auth.js                   # Scrypt security, token sessions, roles
│   │   ├── db.js                     # PostgreSQL connection pool & schema migration
│   │   ├── seed.js                   # Initial sample gym datasets
│   │   └── validators.js             # Data validation logic
│   ├── test/api.test.js              # Automated test suite (18 test scenarios)
│   ├── server.js                     # HTTP server startup & routing
│   ├── docker-compose.yml            # Containerized PostgreSQL 16 setup
│   ├── .env.example                  # Backend database & AI configuration template
│   └── package.json
│
└── README.md                         # Project documentation
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js 20+** (`node -v`)
- **PostgreSQL 14+** or **Docker**

---

### 2. Database Setup

Make sure your PostgreSQL server is running on port `5432`.

**Option A — Using Local PostgreSQL:**
Ensure the PostgreSQL service is active:
```bash
sudo systemctl start postgresql
```

**Option B — Using Docker:**
```bash
cd habesha-fitness-backend
docker compose up -d
```

---

### 3. Backend Setup

1. Open your terminal and enter the backend directory:
   ```bash
   cd habesha-fitness-backend
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` to match your PostgreSQL password:
   ```env
   DATABASE_URL=postgres://postgres:YourPassword@localhost:5432/habesha_fitness
   PORT=4000
   ```
4. Install dependencies and start:
   ```bash
   npm install
   npm start
   ```
   *The server creates the `habesha_fitness` database, schema tables, and initial seed data automatically on first run!*

---

### 4. Frontend Setup

1. Open a second terminal window:
   ```bash
   cd habesha-fitness
   ```
2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Ensure `VITE_API_URL` points to your backend:
   ```env
   VITE_API_URL=http://localhost:4000
   ```
4. Install dependencies and launch the dev server:
   ```bash
   npm install
   npm run dev
   ```
5. Open your browser at **`http://localhost:5173`**.

---

## 🔑 Default Administrator Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Gym Administrator** | `admin@habesha.demo` | `Admin1234` |

> *Tip: You can use the one-click "Fill in" button on the login screen to quickly sign in.*

---

## 📊 Database Schema Overview

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : has
    MEMBERS ||--o{ ATTENDANCE : logs
    MEMBERS ||--o{ PAYMENTS : records
    PLANS ||--o{ MEMBERS : subscribes
    TRAINERS ||--o{ MEMBERS : coaches
    PLANS ||--o{ PAYMENTS : generates

    USERS {
        string email PK
        string name
        string role
        string password_hash
    }
    MEMBERS {
        string id PK
        string name
        string email
        string status
        date join_date
        date expiry_date
    }
    PLANS {
        string id PK
        string name
        numeric price
        int duration_months
    }
    PAYMENTS {
        string id PK
        numeric amount
        date pay_date
        string method
        string status
    }
```

---

## 📡 API Endpoints

<details>
<summary><b>Click to expand full REST API endpoints</b></summary>

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Create member account & pending gym record.
- `POST /api/auth/login` — Authenticate and receive a session token.
- `POST /api/auth/logout` — Invalidate the active session.
- `GET  /api/auth/me` — Retrieve current authenticated profile.
- `PATCH /api/auth/profile` — Update account profile details.

### 🏋️‍♂️ Gym Administration (`/api`)
- `GET  /api/public` — Public gym landing info (plans, trainers, settings).
- `GET  /api/data` — Complete live dataset for the dashboard (`staff` only).
- `GET/POST /api/members` — List filtered members / Add new member.
- `PATCH/DELETE /api/members/:id` — Update member info / Delete member.
- `POST /api/members/:id/assign-plan` — Assign membership plan and record payment.
- `GET/POST /api/plans` — Fetch plans / Create custom plan.
- `GET/POST /api/trainers` — Fetch trainers / Add new trainer.
- `GET/POST /api/payments` — Query payment history / Record payment.
- `POST /api/attendance/check-in` — Check member in.
- `POST /api/attendance/:id/check-out` — Complete visit check-out.

</details>

---

## 🧪 Automated Testing

The backend includes a comprehensive suite of automated tests verifying auth, CRUD operations, transactions, and security:

```bash
cd habesha-fitness-backend
npm test
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ for Ethiopian & Global Fitness Communities.</sub>
</div>
