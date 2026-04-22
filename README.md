# spendwise
# SpendWise 💰

A modern personal finance tracker built to help you understand where your money goes. Clean UI, real-time insights, and everything you need to stay on top of your finances.

---

## Features

### Dashboard
- Monthly income, expense, and net balance summary
- 12-month income vs expense bar chart
- Spending breakdown by category (doughnut chart)
- Recent transactions feed with quick edit and delete

### Transactions
- Add, edit, and delete income or expense entries
- Attach category, date, amount, and optional notes to every transaction
- Search by description
- Filter by type (income / expense) and category
- Month navigator to browse any past month
- Paginated table view

### Budget
- Set monthly spending limits per category
- Visual progress bars showing how much of each budget is used
- Color-coded alerts — amber when nearing limit, red when over budget
- Overall budget utilization summary card

### Settings
- Update display name and preferred currency symbol
- Create custom categories with emoji icon and color
- Manage and delete user-created categories

### Auth
- Secure register and login with JWT
- Sessions persist across page refreshes
- Protected routes — unauthenticated users are redirected to login

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Routing | React Router v6 |
| Charts | Chart.js + react-chartjs-2 |
| HTTP Client | Axios |
| Styling | Pure CSS with CSS variables |
| Backend | Node.js, Express 4 |
| Auth | JWT + bcrypt |
| Database | PostgreSQL (Supabase) |
| Validation | express-validator |

---

## Project Structure

```
spendwise/
├── backend/
│   ├── db/            # PostgreSQL connection and schema
│   ├── middleware/    # JWT auth middleware
│   ├── routes/        # auth, transactions, categories, budgets
│   └── server.js
└── frontend/
    └── src/
        ├── components/   # Layout, modals, cards
        ├── context/      # Auth context
        ├── lib/          # Axios instance
        └── pages/        # Dashboard, Transactions, Budget, Settings
```

---

## API Overview

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/transactions
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id
GET    /api/transactions/summary/monthly
GET    /api/transactions/summary/categories

GET    /api/categories
POST   /api/categories
DELETE /api/categories/:id

GET    /api/budgets
POST   /api/budgets
DELETE /api/budgets/:id
```

---

## Local Development

```bash
# Backend
cd backend
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm install
npm run dev            # http://localhost:4000

# Frontend
cd frontend
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

---

<p align="center">Built with React + Node.js + PostgreSQL</p>
