# Bean & Brew Cafe - Backend API & Real-time Server
# Bean & Brew Cafe - Backend API & Real-time Server (MongoDB)

High-performance REST API and WebSocket engine for **Bean & Brew Cafe**, providing customer dining management, real-time table orders, dynamic table QR code generation, reservations, and staff kitchen pipeline.
High-performance REST API and WebSocket engine for **Bean & Brew Cafe**, powered by **MongoDB** and **Mongoose**, providing customer dining management, real-time table orders, dynamic table QR code generation, reservations, and staff kitchen pipeline.

## 🚀 Technologies

* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: SQLite with `better-sqlite3` (WAL mode enabled)
* **Database**: MongoDB with Mongoose ODM
* **Real-time**: Socket.IO WebSockets
* **Security**: JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), CORS
* **QR Generation**: `qrcode`

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/cafe_connect_hub
JWT_SECRET=bean-and-brew-super-secure-production-secret-key-2026
FRONTEND_URL=http://localhost:5000
NODE_ENV=development
```

### 3. Run the Server
```bash
# Start server
npm start

# Or with dev file watcher
npm run dev
```

---

## 🔑 Default Credentials

* **Role**: Master Administrator
* **Email**: `admin@beanbrew.com`
* **Password**: `admin123`

---

## 📡 API Endpoints
## 📦 MongoDB Collections & Models

### 🔐 Authentication (`/api/auth`)
* `POST /api/auth/customer-login` - Customer quick mobile / OTP login
* `POST /api/auth/admin-login` - Administrator credentials login (returns JWT)
* `GET /api/auth/me` - Get authenticated user profile

### 🍽️ Menu & Products (`/api/menu`)
* `GET /api/menu/categories` - List all menu categories
* `GET /api/menu/products` - List products (supports `?categoryId=X`, `?isPopular=true`, `?search=query`)
* `GET /api/menu/products/:id` - Get single product details
* `POST /api/menu/products` - *[Admin Only]* Create new product
* `PUT /api/menu/products/:id` - *[Admin Only]* Update product
* `DELETE /api/menu/products/:id` - *[Admin Only]* Delete product

### 🧾 Real-Time Orders (`/api/orders`)
* `POST /api/orders` - Place order (emits `new_order` socket event to Kitchen)
* `GET /api/orders` - *[Admin Only]* Get orders with full customer login details
* `GET /api/orders/:id` - *[Admin Only]* Get order details & customer history
* `PATCH /api/orders/:id/status` - *[Admin Only]* Update status (`pending` -> `preparing` -> `ready` -> `completed` -> `cancelled`)
* `DELETE /api/orders/:id` - *[Admin Only]* Remove order

### 🪑 Table & QR Management (`/api/tables`)
* `GET /api/tables` - Get all tables with live occupancy status
* `POST /api/tables/generate-qr` - *[Admin Only]* Generate QR code data URL
* `POST /api/tables` - *[Admin Only]* Create new table
* `PATCH /api/tables/:tableNumber` - *[Admin Only]* Update table capacity/status
* `DELETE /api/tables/:tableNumber` - *[Admin Only]* Remove table

### 📅 Table Reservations (`/api/reservations`)
* `POST /api/reservations` - Book a table
* `GET /api/reservations` - *[Admin Only]* View all bookings
* `PATCH /api/reservations/:id/status` - *[Admin Only]* Update reservation status

### ⭐ Customer Reviews (`/api/reviews`)
* `GET /api/reviews` - Get approved customer reviews
* `POST /api/reviews` - Submit review
* `DELETE /api/reviews/:id` - *[Admin Only]* Delete review

### ✉️ Contact Inquiries (`/api/contact`)
* `POST /api/contact` - Submit contact inquiry
* `GET /api/contact` - *[Admin Only]* View customer inquiries

1. **`users`** — Customer accounts & Admin staff profiles
2. **`categories`** — Menu categories (Coffee, Tea, Pastries, Sandwiches, Salads)
3. **`products`** — Food & beverage catalog with pricing, veg/spicy tags, and images
4. **`tables`** — Dining tables (1–12+) with seating capacity and occupancy metrics
5. **`orders`** — Real-time order tickets with customer login references, table numbers, itemized bills, and lifecycle statuses
6. **`reservations`** — Table booking records
7. **`reviews`** — Customer feedback & star ratings
8. **`contacts`** — Customer inquiry messages
