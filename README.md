# Smishing Detection – Backend

Welcome to the backend of the Smishing Detection project — a mobile security solution designed to combat SMS phishing (smishing) attacks. This repository powers the server-side logic, including user management, database interactions, middleware, and third-party service integrations.

## 📂 Project Structure

```
smishing-backend/
├── .husky/         # Git pre-commit hooks
|
├── docs/           # API documentation
|   └── research/   # Research papers
|   └── technical/  # Architectural diagrams, API documentation etc.
|
├── machine-learning/   # Machine Learning & AI (TO-DO: Move to seperate repo)
|   ├── datasets/       # CSV, parquet files (training data, test sets)
|   ├── notebooks/      # Jupyter notebooks (Model training, evaluation)
|   └── projects/       # Partially complete/completed student projects
|
├── src/
│   ├── configs/        # MongoDB connection, environment config
│   ├── controllers/    # Functions handling request logic for user routes
│   ├── middlewares/    # Auth checks, logging, or other Express middleware
│   ├── models/         # Mongoose schema/models (e.g., user, post, etc.)
│   ├── routes/         # Express route definitions (e.g. /users, /login)
│   ├── services/       # Business logic, 3rd-party integrations (e.g., code for sending emails, external APIs)
│   ├── utils/          # Utility/helper functions (e.g., JWT generation, password hashing, etc.)
│   └── index.js        # Entry point, Express app setup, registering routes/middleware
│
├── tests/          # Unit/integration tests (Jest/Mocha, etc.)
│
├── .env            # Environment variables (DB URI, secrets) - NOT committed
├── .env.example    # Example .env
├── .gitattributes
├── .gitignore
├── .prettierrc     # Prettier config file
├── CONTRIBUTING.md
├── package-lock.json
├── package.json
├── README.md
└── Dockerfile      # (TO-DO) Docker setup for containerizing backend to host in GCP
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- MongoDB or MongoDB Atlas

### 1. Fork this Repository

### 2. Clone your Fork

```bash
git clone https://github.com/your-username/smishing-backend.git
cd smishing-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file using the provided `.env.example` template:

```bash
cp .env.example .env
```

Fill in required values:

- `MONGO_URI=<your_mongodb_connection_string>`
- `PORT` (optional, default `3000`)
- `EMAIL_USER=<your_email_address>`
- `EMAIL_PASS=<your_app_password>` (generate [here](https://myaccount.google.com/apppasswords))
- `JWT_SECRET=` (optional, default `mysecret`)
- `OTP_EXPIRY_MINUTES=` (optional, default `10`)
- `OTP_LENGTH=` (optional, default `6`)
- `OTP_LIMIT=` (optional, default `5`)
- `OTP_LOCKOUT_TIME=` (optional, default `10 * 60 * 1000`)

### 4. Running the Server

```bash
npm run dev
```

This launches the backend with `nodemon` on `http://localhost:3000`.

## 📜 Scripts

| Command          | Description                   |
| ---------------- | ----------------------------- |
| `npm run dev`    | Start in development mode     |
| `npm run test`   | Run tests                     |
| `npm run format` | Run code formatter (Prettier) |

## 🤝 Contribution Guidelines

Please refer to the [contributing guide](CONTRIBUTING.md) for more details
