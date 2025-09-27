# Smishing Detection – Backend

Welcome to the backend of the Smishing Detection project — a mobile security solution designed to combat SMS phishing (smishing) attacks. This repository powers the server-side logic, including user management, database interactions, middleware, and third-party service integrations.

## 📂 Project Structure

```
smishing-backend/
├── .husky/         # Git pre-commit hooks
|
├── docs/           # API documentation
|   ├── research/   # Research papers
|   ├── technical/  # Architectural diagrams, API documentation etc.
|   └── NEWS_API_SETUP.md  # Cyber news API setup guide
|
├── machine-learning/   # Machine Learning & AI (TO-DO: Move to seperate repo)
|   ├── datasets/       # CSV, parquet files (training data, test sets)
|   ├── notebooks/      # Jupyter notebooks (Model training, evaluation)
|   └── projects/       # Partially complete/completed student projects
|
├── postman/        # Postman collections for API testing
│   └── Smishing_Detection_News_API.postman_collection.json
|
├── scripts/        # Utility scripts
│   ├── seed-demo-news.js      # Demo data seeder
│   └── test-news-system.js    # System test script
|
├── src/
│   ├── configs/        # MongoDB connection, environment config
│   ├── controllers/    # Functions handling request logic for routes
│   │   ├── auth.controller.js  # Authentication endpoints
│   │   └── news.controller.js  # News API endpoints
│   ├── middlewares/    # Auth checks, logging, or other Express middleware
│   ├── models/         # Mongoose schema/models
│   │   ├── user.model.js       # User schema
│   │   ├── otp.model.js        # OTP schema
│   │   └── news.model.js       # News article schema
│   ├── routes/         # Express route definitions
│   │   ├── auth.route.js       # Authentication routes
│   │   └── news.route.js       # News API routes
│   ├── services/       # Business logic, 3rd-party integrations
│   │   ├── email.service.js    # Email sending service
│   │   ├── newsApi.service.js  # External news API integrations
│   │   └── newsFetcher.service.js  # News caching service
│   ├── utils/          # Utility/helper functions
│   │   ├── otp.util.js         # OTP generation/verification
│   │   ├── token.util.js       # JWT and password utilities
│   │   └── scheduler.util.js   # News fetching scheduler
│   └── index.js        # Entry point, Express app setup
│
├── tests/          # Unit/integration tests (Jest)
│   └── news.test.js    # News API tests
│
├── .env            # Environment variables (DB URI, secrets) - NOT committed
├── .env.example    # Example .env with news API keys
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

**Core Configuration:**
- `MONGO_URI=<your_mongodb_connection_string>`
- `PORT` (optional, default `3000`)
- `EMAIL_USER=<your_email_address>`
- `EMAIL_PASS=<your_app_password>` (generate [here](https://myaccount.google.com/apppasswords))
- `JWT_SECRET=` (optional, default `mysecret`)

**OTP Configuration:**
- `OTP_EXPIRY_MINUTES=` (optional, default `10`)
- `OTP_LENGTH=` (optional, default `6`)
- `OTP_LIMIT=` (optional, default `5`)
- `OTP_LOCKOUT_TIME=` (optional, default `10 * 60 * 1000`)

**News API Configuration (Optional):**
- `NEWS_API_KEY=` (get from [newsapi.org](https://newsapi.org/register))
- `GUARDIAN_API_KEY=` (get from [Guardian Open Platform](https://open-platform.theguardian.com/access/))

### 4. Running the Server

```bash
npm run dev
```

This launches the backend with `nodemon` on `http://localhost:3000`.

## 📜 Scripts

| Command                              | Description                           |
| ------------------------------------ | ------------------------------------- |
| `npm run dev`                        | Start in development mode             |
| `npm run test`                       | Run tests                             |
| `npm run test:watch`                 | Run tests in watch mode               |
| `npm run test:coverage`              | Run tests with coverage report        |
| `npm run format`                     | Run code formatter (Prettier)        |
| `node scripts/seed-demo-news.js`     | Seed database with demo news articles |
| `node scripts/test-news-system.js`   | Test the complete news system         |

## 🔥 New Features

### 📰 Cyber News Caching System
- **Automatic News Fetching**: Fetches cybersecurity news every 6 hours from multiple sources
- **Smart Categorization**: Automatically categorizes articles (phishing, malware, data-breach, etc.)
- **Advanced Filtering**: Search, filter by category, tags, and pagination support
- **Multiple Sources**: Integrates with NewsAPI.org and The Guardian API
- **Caching Strategy**: Stores articles locally for fast retrieval and offline access

### 🚀 API Endpoints

#### News Endpoints
- `GET /api/news` - Get cached news with filtering and pagination
- `GET /api/news/stats` - Get news cache statistics
- `GET /api/news/categories` - Get available news categories
- `POST /api/news/fetch` - Manually trigger news fetch

#### Authentication Endpoints (Existing)
- `POST /api/auth/signup` - User registration
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### 🧪 Testing

#### Quick Start Testing
```bash
# Seed demo data (no API keys required)
node scripts/seed-demo-news.js

# Test the complete system
node scripts/test-news-system.js

# Run unit tests
npm test
```

#### Postman Testing
1. Import collection: `postman/Smishing_Detection_News_API.postman_collection.json`
2. Set `baseUrl` to `http://localhost:3000`
3. Test all endpoints with sample data

## 🤝 Contribution Guidelines

Please refer to the [contributing guide](CONTRIBUTING.md) for more details
