# Bean & Brew Cafe - Backend API & Real-time Server (MongoDB)

High-performance REST API and WebSocket engine for **Bean & Brew Cafe**, powered by **MongoDB** and **Mongoose**, providing customer dining management, real-time table orders, dynamic table QR code generation, reservations, and staff kitchen pipeline.

## 🚀 Technologies

* **Runtime**: Node.js
* **Framework**: Express.js
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

## 📦 MongoDB Collections & Models

1. **`users`** — Customer accounts & Admin staff profiles
2. **`categories`** — Menu categories (Coffee, Tea, Pastries, Sandwiches, Salads)
3. **`products`** — Food & beverage catalog with pricing, veg/spicy tags, and images
4. **`tables`** — Dining tables (1–12+) with seating capacity and occupancy metrics
5. **`orders`** — Real-time order tickets with customer login references, table numbers, itemized bills, and lifecycle statuses
6. **`reservations`** — Table booking records
7. **`reviews`** — Customer feedback & star ratings
8. **`contacts`** — Customer inquiry messages
