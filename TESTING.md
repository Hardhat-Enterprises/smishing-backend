# TESTING.md

# Automated Backend Testing

This document explains the automated testing setup used in the Smishing Detection backend project.

---

# Testing Framework

The backend uses the following tools for automated integration testing:

- **Jest** – JavaScript testing framework
- **Supertest** – HTTP endpoint testing library for Express applications

These tools are used to validate backend API behaviour, request validation, error handling, and external service integration behaviour.

---

# Running Tests

Install dependencies before running tests:

```bash
npm install
```

Run all automated tests:

```bash
npm test
```

The automated test suite will execute all `.test.js` files located in the `tests/` directory.

---

# Test Environment

Tests run using:

```text
NODE_ENV=test
```

During test execution:

- MongoDB initialization is disabled where applicable
- SMTP/email service initialization is disabled where applicable
- External ML API requests are mocked
- Tests are isolated from external dependencies

This ensures tests are reliable, repeatable, and independent from live services.

---

# Test Structure

```text
tests/
├── mocks/
│   ├── axios.mock.js
│   └── email.mock.js
│
├── auth.test.js
├── contact.test.js
├── feedback.test.js
├── health.test.js
├── reports.test.js
└── scan.test.js
```

---

# Current Test Coverage

## `/api/scan`

Tests include:

- Missing input validation
- Empty message validation
- Happy path prediction response
- Long message handling
- ML service failure handling
- ML timeout simulation
- Invalid ML response handling

---

## Authentication Routes

Tests include:

- Missing login fields
- Partial login data
- Empty login values

---

## Contact Routes

Tests include:

- Missing request fields
- Incomplete request validation

---

## Feedback Routes

Tests include:

- Missing feedback data validation

---

## Reports Routes

Tests include:

- Missing message validation
- Error response validation

---

## Health Route

Tests include:

- Backend availability verification
- Successful route response validation

---

# Mocking Strategy

External services are mocked during testing to avoid dependency on live systems.

## Axios Mocking

The ML prediction service is mocked using reusable Axios mock functions.

Purpose:

- Prevent real API calls
- Simulate ML responses
- Simulate failures and timeouts
- Improve test reliability

---

## Email Mocking

The email service is mocked to prevent:

- Real SMTP connections
- Sending real emails
- Test instability caused by external email services

---

# Response Validation

Tests validate:

- Correct status codes
- Consistent response structures
- Presence of expected response fields
- Error handling behaviour

Reusable helper functions are used where applicable to improve consistency across test files.

---

# Purpose of Automated Testing

The automated testing framework was implemented to:

- Improve backend reliability
- Detect regressions early
- Reduce reliance on manual testing
- Validate API behaviour consistently
- Improve maintainability of backend routes
- Support long-term scalability of the backend

---

# Notes for Developers

- Add new route tests inside the `tests/` directory
- Mock external services where possible
- Keep tests isolated and repeatable
- Ensure tests pass before creating pull requests
- Use reusable helpers and mocks to reduce duplication

# TESTING.md

# Automated Backend Testing

This document explains the automated testing setup used in the Smishing Detection backend project.

---

# Testing Framework

The backend uses the following tools for automated integration testing:

- **Jest** – JavaScript testing framework
- **Supertest** – HTTP endpoint testing library for Express applications

These tools are used to validate backend API behaviour, request validation, error handling, and external service integration behaviour.

---

# Running Tests

Install dependencies before running tests:

```bash
npm install
```

Run all automated tests:

```bash
npm test
```

The automated test suite will execute all `.test.js` files located in the `tests/` directory.

---

# Test Environment

Tests run using:

```text
NODE_ENV=test
```

During test execution:

- MongoDB initialization is disabled where applicable
- SMTP/email service initialization is disabled where applicable
- External ML API requests are mocked
- Tests are isolated from external dependencies

This ensures tests are reliable, repeatable, and independent from live services.

---

# Test Structure

```text
tests/
├── mocks/
│   ├── axios.mock.js
│   └── email.mock.js
│
├── auth.test.js
├── contact.test.js
├── feedback.test.js
├── health.test.js
├── reports.test.js
└── scan.test.js
```

---

# Current Test Coverage

## `/api/scan`

Tests include:

- Missing input validation
- Empty message validation
- Happy path prediction response
- Long message handling
- ML service failure handling
- ML timeout simulation
- Invalid ML response handling

---

## Authentication Routes

Tests include:

- Missing login fields
- Partial login data
- Empty login values

---

## Contact Routes

Tests include:

- Missing request fields
- Incomplete request validation

---

## Feedback Routes

Tests include:

- Missing feedback data validation

---

## Reports Routes

Tests include:

- Missing message validation
- Error response validation

---

## Health Route

Tests include:

- Backend availability verification
- Successful route response validation

---

# Mocking Strategy

External services are mocked during testing to avoid dependency on live systems.

## Axios Mocking

The ML prediction service is mocked using reusable Axios mock functions.

Purpose:

- Prevent real API calls
- Simulate ML responses
- Simulate failures and timeouts
- Improve test reliability

---

## Email Mocking

The email service is mocked to prevent:

- Real SMTP connections
- Sending real emails
- Test instability caused by external email services

---

# Response Validation

Tests validate:

- Correct status codes
- Consistent response structures
- Presence of expected response fields
- Error handling behaviour

Reusable helper functions are used where applicable to improve consistency across test files.

---

# Purpose of Automated Testing

The automated testing framework was implemented to:

- Improve backend reliability
- Detect regressions early
- Reduce reliance on manual testing
- Validate API behaviour consistently
- Improve maintainability of backend routes
- Support long-term scalability of the backend

---

# Notes for Developers

- Add new route tests inside the `tests/` directory
- Mock external services where possible
- Keep tests isolated and repeatable
- Ensure tests pass before creating pull requests
- Use reusable helpers and mocks to reduce duplication
