# API Quick Reference

## Base URLs
- **Development**: `http://localhost:3000`
- **Production**: Update as needed

## Authentication
All protected endpoints require:
```
Authorization: Bearer <jwt-token>
```

## News API Endpoints

### Get News Articles
```
GET /api/news?category=phishing&limit=10&page=1
```
**Parameters**: category, limit (max 100), page, search, tags, sortBy, sortOrder

### Get Categories
```
GET /api/news/categories
```
**Returns**: `["cybersecurity", "data-breach", "malware", "phishing"]`

### Get News Statistics
```
GET /api/news/stats
```

### Get Single Article
```
GET /api/news/:id
```

## Auth Endpoints

### Login
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Signup
```
POST /api/auth/signup
{
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "email": "user@example.com",
  "password": "password123"
}
```

### Verify Email
```
POST /api/auth/verify-email
{
  "email": "user@example.com",
  "otp": "123456"
}
```

## Response Format
```json
{
  "success": true,
  "data": {...},
  "pagination": {...}, // For paginated endpoints
  "message": "Success message"
}
```

## Error Format
```json
{
  "success": false,
  "message": "Error description"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized  
- `404` - Not Found
- `500` - Server Error

## Categories
- `cybersecurity` - General cybersecurity news
- `data-breach` - Data breaches and leaks  
- `malware` - Malware, ransomware, viruses
- `phishing` - Phishing, smishing, social engineering

## Rate Limits
- General: 100 req/15min
- Auth: 5 req/15min
- Admin: 10 req/min