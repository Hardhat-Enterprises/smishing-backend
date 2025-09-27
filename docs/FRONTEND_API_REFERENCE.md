# Frontend API Reference - Smishing Detection Backend

## Overview
This document provides comprehensive API reference for frontend developers working with the Smishing Detection backend system. The backend focuses on cybersecurity news aggregation and user authentication.

## Base URLs
- **Development**: `http://localhost:3000`
- **Production**: `https://your-production-domain.com` (update as needed)

## Authentication

### JWT Token Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### 1. User Signup
**POST** `/api/auth/signup`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "userId": "64f8b9c123456789abcdef01",
    "email": "john@example.com",
    "isEmailVerified": false
  }
}
```

#### 2. Verify Email
**POST** `/api/auth/verify-email`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "isEmailVerified": true
  }
}
```

#### 3. User Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f8b9c123456789abcdef01",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "isEmailVerified": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## News API

### News Data Model
Each news article follows this structure:

```json
{
  "_id": "64f8b9c123456789abcdef02",
  "title": "Major Cybersecurity Breach Affects Millions",
  "description": "A significant data breach has compromised personal information...",
  "content": "Full article content here...",
  "url": "https://example.com/news/article",
  "urlToImage": "https://example.com/image.jpg",
  "publishedAt": "2024-01-15T08:00:00.000Z",
  "source": {
    "name": "TechCrunch",
    "id": "techcrunch"
  },
  "author": "Jane Smith",
  "category": "data-breach",
  "tags": ["cybersecurity", "data-breach", "privacy", "gdpr"],
  "isActive": true,
  "fetchedAt": "2024-01-15T09:00:00.000Z",
  "createdAt": "2024-01-15T09:00:00.000Z",
  "updatedAt": "2024-01-15T09:00:00.000Z"
}
```

### Available Categories
- `cybersecurity` - General cybersecurity news
- `data-breach` - Data breaches and leaks
- `malware` - Malware, ransomware, viruses
- `phishing` - Phishing, smishing, social engineering

### News Endpoints

#### 1. Get All News
**GET** `/api/news`

**Query Parameters:**
- `category` (optional): Filter by category (`cybersecurity`, `data-breach`, `malware`, `phishing`)
- `limit` (optional, default: 20, max: 100): Number of articles per page
- `page` (optional, default: 1): Page number
- `search` (optional): Search in title and description
- `tags` (optional): Comma-separated tags to filter by
- `sortBy` (optional, default: `publishedAt`): Field to sort by
- `sortOrder` (optional, default: `desc`): Sort order (`asc` or `desc`)

**Example Requests:**
```
GET /api/news
GET /api/news?category=phishing&limit=10&page=1
GET /api/news?search=ransomware&sortBy=publishedAt&sortOrder=desc
GET /api/news?tags=malware,security&limit=5
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8b9c123456789abcdef02",
      "title": "Major Cybersecurity Breach Affects Millions",
      "description": "A significant data breach has compromised...",
      "url": "https://example.com/news/article",
      "urlToImage": "https://example.com/image.jpg",
      "publishedAt": "2024-01-15T08:00:00.000Z",
      "source": {
        "name": "TechCrunch",
        "id": "techcrunch"
      },
      "author": "Jane Smith",
      "category": "data-breach",
      "tags": ["cybersecurity", "data-breach", "privacy"],
      "isActive": true
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalArticles": 287,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "message": "Retrieved 20 cybersecurity articles"
}
```

#### 2. Get News Statistics
**GET** `/api/news/stats`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalArticles": 1250,
    "categoryCounts": {
      "cybersecurity": 650,
      "data-breach": 280,
      "malware": 220,
      "phishing": 100
    },
    "sourceCounts": {
      "TechCrunch": 125,
      "The Guardian": 98,
      "SecurityWeek": 87
    },
    "lastFetchedAt": "2024-01-15T12:00:00.000Z",
    "articlesThisWeek": 45,
    "articlesToday": 8
  },
  "message": "News statistics retrieved successfully"
}
```

#### 3. Get Available Categories
**GET** `/api/news/categories`

**Response (200):**
```json
{
  "success": true,
  "data": ["cybersecurity", "data-breach", "malware", "phishing"],
  "message": "Cybersecurity categories retrieved successfully"
}
```

#### 4. Get Single Article by ID
**GET** `/api/news/:id`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8b9c123456789abcdef02",
    "title": "Major Cybersecurity Breach Affects Millions",
    "description": "A significant data breach has compromised...",
    "content": "Full article content here...",
    "url": "https://example.com/news/article",
    "urlToImage": "https://example.com/image.jpg",
    "publishedAt": "2024-01-15T08:00:00.000Z",
    "source": {
      "name": "TechCrunch",
      "id": "techcrunch"
    },
    "author": "Jane Smith",
    "category": "data-breach",
    "tags": ["cybersecurity", "data-breach", "privacy", "gdpr"],
    "isActive": true
  },
  "message": "Article retrieved successfully"
}
```

#### 5. Manual News Fetch (Admin)
**POST** `/api/news/fetch`
*Requires admin authentication*

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalFetched": 150,
    "totalStored": 45,
    "duplicatesSkipped": 85,
    "irrelevantFiltered": 20,
    "sources": {
      "newsapi": 35,
      "guardian": 10
    }
  },
  "message": "Cybersecurity news fetch completed. 45 articles stored."
}
```

## Error Handling

### Error Response Format
All API errors follow this consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details if available"
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created (for signup, etc.)
- `400` - Bad Request (invalid parameters, validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

### Example Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid category. Must be one of: cybersecurity, data-breach, malware, phishing"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Article not found"
}
```

## Rate Limiting
- **General endpoints**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP
- **Admin endpoints**: 10 requests per minute

## Data Validation Rules

### User Registration
- `fullName`: Required, 2-50 characters
- `email`: Required, valid email format, unique
- `phoneNumber`: Required, valid phone format (E.164)
- `password`: Required, minimum 8 characters, must contain letters and numbers

### News Filtering
- Only cybersecurity-related articles are stored and returned
- Articles are automatically categorized using AI-powered classification
- Non-cybersecurity content is automatically filtered out
- Duplicate articles (same URL) are prevented

## Pagination Guidelines

### Request Parameters
```javascript
const params = {
  page: 1,        // Page number (starts from 1)
  limit: 20       // Items per page (max 100)
};
```

### Response Structure
```javascript
const response = {
  data: [...],    // Array of items
  pagination: {
    currentPage: 1,
    totalPages: 15,
    totalArticles: 287,
    hasNextPage: true,
    hasPreviousPage: false
  }
};
```

## Real-time Updates
The system fetches new cybersecurity news every 6 hours automatically. For real-time updates in your frontend:

1. **Polling**: Check `/api/news` periodically (recommended: every 5-10 minutes)
2. **Manual Refresh**: Provide a refresh button that calls `/api/news`
3. **Statistics Updates**: Check `/api/news/stats` for cache status

## Security Considerations

### API Security
- Always use HTTPS in production
- Store JWT tokens securely (httpOnly cookies recommended)
- Implement proper CORS configuration
- Never expose sensitive data in error messages

### Content Security
- All news content is pre-filtered for cybersecurity relevance
- No user-generated content is stored
- External links should open with `rel="noopener noreferrer"`
- Images from external sources should be loaded securely

## Integration Examples

### Fetch News with Pagination
```javascript
async function fetchNews(page = 1, category = '', search = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...(category && { category }),
    ...(search && { search })
  });

  const response = await fetch(`/api/news?${params}`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  return data;
}
```

### Login and Store Token
```javascript
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('authToken', data.data.token);
    return data.data.user;
  } else {
    throw new Error(data.message);
  }
}
```

### Make Authenticated Requests
```javascript
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('authToken');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}
```

## Testing Endpoints

Use the provided Postman collection:
`/postman/Smishing_Detection_News_API.postman_collection.json`

### Quick Test Checklist
1. Health check: `GET /api/health`
2. Get categories: `GET /api/news/categories`
3. Get latest news: `GET /api/news?limit=5`
4. Search news: `GET /api/news?search=phishing`
5. Get statistics: `GET /api/news/stats`

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Support**: Contact backend team for API-related questions