# UniMentor

A mobile application that connects university students with mentors for academic guidance and support.

Built with **React Native (Expo)** on the frontend and **Node.js / Express / MongoDB** on the backend, following a **layered architecture**.

---

## Project Structure

```
UniMentor/
├── mobile/          # React Native (Expo) app
│   └── src/
│       ├── presentation/   # Screens, navigation, UI components
│       ├── domain/         # Entities, use cases, state stores (Zustand)
│       └── data/           # API client, repositories
│
└── backend/         # Express REST API
    └── src/
        ├── config/         # DB connection
        ├── models/         # Mongoose schemas
        ├── controllers/    # Request handlers
        ├── routes/         # Express routers
        └── middleware/     # Auth, error handling
```

---

## Architecture — Layered Design

| Layer | Responsibility |
|---|---|
| **Presentation** | Screens, navigation, UI — React Native components |
| **Domain** | Business logic — use cases, entities, Zustand stores |
| **Data** | API calls, repositories — Axios-based HTTP client |
| **Backend API** | Express controllers, Mongoose models, JWT auth |

---

## Getting Started

### Prerequisites
- Node.js >= 18
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- Expo Go on your phone

### Backend

1. In Atlas: create a free cluster, a database user, and allow your IP (or `0.0.0.0/0` for development).
2. Click **Connect** → **Drivers** and copy the `mongodb+srv://...` URI.

```bash
cd backend
cp .env.example .env
```

Set `MONGO_URI` to that Atlas URI (include `/unimentor` before the `?`) and set `JWT_SECRET`.

```bash
npm install
npm run dev               # starts on http://localhost:5000
```

### Mobile App

```bash
cd mobile
cp .env.example .env      # set EXPO_PUBLIC_API_URL
npm install
npx expo start            # scan QR with Expo Go
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, receive JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/mentors/search?q=` | ✅ | Search mentors |
| GET | `/api/mentors/:id` | ✅ | Get mentor profile |
| GET | `/api/sessions/me` | ✅ | Get my sessions |
| POST | `/api/sessions` | ✅ | Book a session |
| PATCH | `/api/sessions/:id/cancel` | ✅ | Cancel a session |
| POST | `/api/sessions/:id/verify` | mentor | Verify booking with student code |
| GET | `/api/learning/dashboard` | ✅ | Role-based learning home data |
| GET/POST | `/api/materials` | ✅ | Study packs (mentors create) |
| GET/POST | `/api/assessments` | ✅ | Quizzes and submissions |
| GET/POST | `/api/goals` | student | Learning goals and hour logs |
| GET/POST | `/api/groups` | ✅ | Study groups |
| GET/POST | `/api/chats` | ✅ | Direct and group messages |
| GET | `/api/notifications` | ✅ | Alerts |
| GET/POST | `/api/complaints` | ✅ | Academic integrity cases |

Demo logins after `npm run init-db`: `student@unimentor.dev`, `mentor@unimentor.dev`, `lic@unimentor.dev`, `admin@unimentor.dev` (password `password123`).

---

## Tech Stack

- **Mobile**: React Native, Expo, TypeScript, Zustand, React Navigation, Axios
- **Backend**: Node.js, Express, TypeScript, Mongoose, JWT, bcryptjs
- **Database**: MongoDB
