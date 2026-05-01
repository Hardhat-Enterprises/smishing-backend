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
- Postman

### 1. Fork this Repository

Make sure to fork the `dev` branch or both `main` and `dev`, not ONLY the `main`. (Helpful guide [here](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo))

### 2. Clone your Fork

- In the forked repository in your Github account, make sure you are on `dev` branch and go to `Code` then, copy the link `https://github.com/your-username/smishing-backend.git`
- Open Git Bash and change directory to the folder where you want to clone your forked repository. Example

```bash
cd your-folder
```

- Next, execute these commands:

```bash
git clone https://github.com/your-username/smishing-backend.git
cd smishing-backend
```

(Helpful guide [here](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)) in `Cloning your forked repository` section.

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup MongoDB or MongoDB Atlas

- Sign in to MongoDB Atlas.
- Create a cluster (Cluster0 will be created).
- In Cluster0, Select `Drivers` and look for the connection string with the format (sample) `mongodb+srv://<db-username>:<db_password>@cluster0.huhaycw.mongodb.net/?appName=Cluster0` and copy.

### 4. Setup Environment Variables

Create a `.env` file using the provided `.env.example` template:

```bash
cp .env.example .env
```

- Open `.env` file from your cloned smishing-backend folder.

ONLY Fill the values for `MONGO_URI`, `EMAIL_USER`, and `EMAIL_PASS` for environment variables setup:

feature/ai-chat-api

- `PORT=4000`
- `NODE_ENV=development`
- `FLASK_API_URL=http://localhost:5000`

Server

- `PORT=3000`

MongoDB

- `MONGO_URI=<your_mongodb_connection_string>`

JWT

- `JWT_SECRET=to-be-changed-in-production`

Email

- `EMAIL_HOST=smtp.gmail.com`
- `EMAIL_PORT=465`
- `EMAIL_SECURE=true`
- `EMAIL_USER=<your_email_address>`
- `EMAIL_PASS=<your_app_password>` (generate [here](https://myaccount.google.com/apppasswords))

OTP Settings

- `OTP_LENGTH=6`
- `OTP_EXPIRY_MINUTES=10`
- `OTP_LIMIT=5`
- `OTP_LOCKOUT_TIME=600000`

---- Backup Codes ----

- `BACKUP_CODE_COUNT=5`
- `BACKUP_CODE_LENGTH=8`
- `BACKUP_CODE_SALT_ROUNDS=10`

Dev

- `EMAIL_DISABLED=`
  `feature/ai-chat-api`

ML_Service

- `ML_SERVICE_URL=`

(NOTE: In case there changes made in the content of .env, please update the list of content above.)

### 5. Running the Server

```bash
npm run dev
```

This launches the backend with `nodemon` on `http://localhost:3000`.
A message below indicates the successful running of the server:

`SMTP ENV { host: 'smtp.gmail.com', port: '465' } { user_end: '.com', pass_len: 16 }`  
`Server running on port 3000`  
`Connected to MongoDB`  
` SMTP ready`

## 📜 Scripts

| Command          | Description                   |
| ---------------- | ----------------------------- |
| `npm run dev`    | Start in development mode     |
| `npm run test`   | Run tests                     |
| `npm run format` | Run code formatter (Prettier) |

## 🤝 Contribution Guidelines

Please refer to the [contributing guide](CONTRIBUTING.md) for more details
