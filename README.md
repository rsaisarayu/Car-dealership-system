# Car Dealership Inventory System

A full-stack, beginner-friendly web application designed to manage a car dealership inventory with secure user authentication, role-based access control (User vs. Admin), dynamic vehicle filtering, real-time purchase operations, and administrative restock/CRUD tools.

---

## 1. Project Aim & Overview

The aim of this project is to build a reliable, beginner-accessible, and full-featured Car Dealership Management System following strict **Test-Driven Development (TDD)** principles.

### The Problem with Traditional Dealership Systems
- **Manual & Error-Prone Stock Tracking**: Dealerships often track inventory manually or with disconnected spreadsheets, leading to overselling out-of-stock models.
- **Lack of Role-Based Security**: Basic systems fail to separate buyer actions from managerial tasks like restock, editing vehicle details, or deletion.
- **Complex Setups**: Many existing enterprise solutions require heavy database servers and convoluted configuration steps that are difficult for new developers to run and test locally.

### The Proposed Solution
- **Lightweight & Self-Contained**: Uses Node.js/Express with native, file-based SQLite database storage (`node:sqlite`), requiring zero database servers or complex configuration.
- **Full Role-Based Workflow**: Provides token-based authentication (JWT) with separate permissions for regular buyers (browse, search, purchase) and admins (add, edit, restock, delete).
- **Interactive Single Page Application (SPA)**: Built with React and Tailwind CSS, featuring live search/filtering, disabled purchase buttons for sold-out inventory, and intuitive modals.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend API** | Node.js & Express.js | RESTful API server and request routing |
| **Database** | SQLite (`node:sqlite`) | Persistent local relational storage for users and vehicles |
| **Authentication** | JSON Web Tokens (JWT) & bcryptjs | Secure stateless authentication and password hashing |
| **Testing** | Node Test Runner (`node:test`) & Supertest | Fast, automated TDD integration and unit test suite |
| **Frontend** | React 18 & Vite | Fast, modern single-page user interface |
| **Styling** | Tailwind CSS | Responsive and clean modern UI design |
| **Icons** | Lucide React | Lightweight vector iconography |

---

## 3. Project Architecture & Execution Flow

### System Architecture Diagram

```
+-------------------------------------------------------------+
|                      React SPA (Vite)                       |
|  - Auth Forms (Login / Register / Role Toggle)              |
|  - Inventory Dashboard & Search / Filter Controls           |
|  - Purchase Actions (Disabled when stock = 0)               |
|  - Admin Controls (Add, Edit, Restock, Delete Modals)       |
+------------------------------+------------------------------+
                               |
                        HTTP / JSON (JWT)
                               |
                               v
+-------------------------------------------------------------+
|                    Express REST API Server                  |
|  - Auth Middleware (JWT Token Verification)                 |
|  - Role Checker (Admin-only route protection)               |
|  - Route Handlers (/api/auth, /api/vehicles, /inventory)    |
+------------------------------+------------------------------+
                               |
                        SQL Prepared Queries
                               |
                               v
+-------------------------------------------------------------+
|                     Persistent SQLite DB                    |
|  - users table (id, username, password, role)               |
|  - vehicles table (id, make, model, category, price, qty)   |
+-------------------------------------------------------------+
```

### Execution Flow

1. **User Authentication Flow**:
   - User inputs credentials on the frontend.
   - `POST /api/auth/register` creates the user with a bcrypt-hashed password.
   - `POST /api/auth/login` verifies credentials and issues a signed JWT token.
   - Frontend stores the token in `localStorage` and attaches it as `Bearer <token>` for subsequent requests.

2. **Vehicle Browsing & Filtering Flow**:
   - Authenticated user requests inventory.
   - `GET /api/vehicles` fetches all vehicles sorted by most recently added.
   - `GET /api/vehicles/search?make=...&category=...&minPrice=...` filters records with parameterized SQL queries.

3. **Purchase Flow**:
   - User clicks **Purchase Vehicle**.
   - `POST /api/vehicles/:id/purchase` validates that stock `quantity > 0`.
   - Backend decreases `quantity` by 1 and returns updated state.
   - When `quantity === 0`, frontend disables the button and marks the car as "Out of Stock".

4. **Admin Management Flow**:
   - Admin uses **Add Vehicle** or **Edit Vehicle** modals.
   - `POST /api/vehicles` or `PUT /api/vehicles/:id` updates vehicle details in SQLite.
   - `POST /api/vehicles/:id/restock` increments quantity by the specified amount.
   - `DELETE /api/vehicles/:id` safely removes the record (forbidden for non-admins).

---

## 4. Implementation File Details

```
Car dealership system/
├── backend/
│   ├── package.json          # Backend dependencies and test scripts
│   ├── db.js                 # SQLite database connection and table schemas
│   ├── server.js             # Express application, routes, and auth middleware
│   └── tests/
│       ├── auth.test.js      # TDD tests for registration, login, and JWT tokens
│       ├── vehicles.test.js  # TDD tests for vehicle CRUD and search/filtering
│       └── inventory.test.js # TDD tests for purchase deductions and admin restock
├── frontend/
│   ├── package.json          # Frontend dependencies (React, Tailwind, Vite)
│   ├── vite.config.js        # Vite development server configuration
│   ├── tailwind.config.js    # Tailwind styling configuration
│   ├── postcss.config.js     # PostCSS styling pipeline
│   ├── index.html            # Single page application entry HTML
│   └── src/
│       ├── index.css         # Tailwind base and utility directives
│       ├── api.js            # Fetch API client with automatic token injection
│       ├── App.jsx           # Main React component (Navbar, Auth, Grid, Modals)
│       └── main.jsx          # React DOM root mounting
├── .gitignore                # Ignored build outputs and dependencies
├── README.md                 # Complete project guide and documentation
└── PROMPTS.md                # Raw AI conversation log
```

---

## 5. Local Setup & Run Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ or 20+ / 22+ / 24+)
- Git

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd "Car dealership system"
```

### Step 2: Set Up and Run the Backend
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start backend server (runs on http://localhost:5000)
npm start
```

### Step 3: Set Up and Run the Frontend
Open a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser at **`http://localhost:5173`** to interact with the application.

---

## 6. Test-Driven Development (TDD) & Test Report

The backend was developed using strict **Red-Green-Refactor** cycles:
1. **Red**: Wrote automated unit and integration tests for every endpoint before writing route handlers.
2. **Green**: Implemented minimal, beginner-level code to satisfy all test criteria.
3. **Refactor**: Cleaned and organized logic while keeping tests passing.

### Running Automated Tests
In the `backend/` directory, execute:
```bash
npm test
```

### Test Suite Execution Report

```text
✔ POST /api/auth/register - successfully registers a regular user (133.6ms)
✔ POST /api/auth/register - registers an admin user (113.6ms)
✔ POST /api/auth/register - rejects missing username or password (11.4ms)
✔ POST /api/auth/register - rejects duplicate username (105.0ms)
✔ POST /api/auth/login - successfully logs in and returns a token (156.9ms)
✔ POST /api/auth/login - fails with incorrect password (108.2ms)
✔ POST /api/vehicles/:id/purchase - reduces stock quantity by 1 (440.4ms)
✔ POST /api/vehicles/:id/purchase - fails when vehicle is out of stock (15.5ms)
✔ POST /api/vehicles/:id/purchase - returns 404 for non-existent vehicle (9.6ms)
✔ POST /api/vehicles/:id/restock - increases quantity for admin user (19.7ms)
✔ POST /api/vehicles/:id/restock - rejects regular user with 403 (17.2ms)
✔ POST /api/vehicles/:id/restock - rejects invalid restock amount (17.1ms)
✔ POST /api/vehicles - creates a vehicle with valid token (465.7ms)
✔ POST /api/vehicles - rejects request without token (12.0ms)
✔ POST /api/vehicles - rejects incomplete fields (9.1ms)
✔ GET /api/vehicles - returns all vehicles (27.0ms)
✔ GET /api/vehicles/search - filters by category and price range (23.9ms)
✔ PUT /api/vehicles/:id - updates vehicle details (21.8ms)
✔ DELETE /api/vehicles/:id - fails for regular user (16.9ms)
✔ DELETE /api/vehicles/:id - succeeds for admin user (19.4ms)

-------------------------------------------------------
Total Tests: 20 passed, 0 failed, 0 skipped (100% Pass)
Duration: ~3.2s
-------------------------------------------------------
```

---

## 7. My AI Usage

### 1. Which AI Tools Were Used
- **Google Gemini (via Antigravity AI)**: Used as the primary AI pair-programming assistant for architecture planning, test suite formulation, step-by-step TDD verification, and code scaffolding.

### 2. How the AI Was Used
- **Architecture & Schema Planning**: Used Gemini to design a clean, beginner-level database schema and select zero-configuration persistent SQLite storage using Node's built-in capabilities.
- **TDD Test Case Generation**: Used the AI to draft comprehensive test cases covering edge conditions (out-of-stock purchases, unauthorized admin actions, duplicate registrations, and parameterized search queries).
- **Step-by-Step Implementation**: Iteratively implemented backend routes, middleware, and React frontend components in modular phases with user review gates.
- **Documentation & Walkthrough**: Used AI to generate architectural diagrams and system flow documentation.

### 3. Reflection on AI Impact
Using an AI pair programmer significantly streamlined the Red-Green-Refactor development cycle. Rather than writing repetitive test scaffolding manually, AI enabled immediate edge-case test generation so focus could stay on robust application logic and clean design. Breaking down the work into discrete review gates ensured full control over every piece of code generated.

---

## 8. API Reference Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Create a new user (`username`, `password`, optional `role: "admin"`).
- `POST /api/auth/login`: Authenticate and receive a JWT token.

### Vehicle Management (`/api/vehicles`)
- `GET /api/vehicles`: Retrieve all vehicles (Protected).
- `GET /api/vehicles/search`: Search with filters `?make=&model=&category=&minPrice=&maxPrice=` (Protected).
- `POST /api/vehicles`: Add a new vehicle (Protected).
- `PUT /api/vehicles/:id`: Update vehicle details (Protected).
- `DELETE /api/vehicles/:id`: Delete vehicle (Admin only).

### Inventory (`/api/vehicles/:id`)
- `POST /api/vehicles/:id/purchase`: Purchase 1 unit (decreases stock; fails if stock = 0).
- `POST /api/vehicles/:id/restock`: Restock vehicle by `quantity` units (Admin only).
