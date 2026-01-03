# 📚 API DOKUMENTASYONU - ULTRARSLANOGLU GATEWAY

## 🌐 Base URL
```
http://localhost:5000
```

## 🔐 Authentication

### JWT Token Format
```
Authorization: Bearer <token>
```

### Token Expiry
- **Default**: 24 hours
- **Refresh**: POST /api/auth/refresh-token

---

## 📋 API ENDPOINTS

### 1️⃣ HEALTH & INFO

#### GET /health
System health check
```bash
curl http://localhost:5000/health
```

**Response** (200):
```json
{
  "status": "healthy",
  "service": "Ultrarslanoglu API Gateway",
  "version": "2.0.0",
  "modules": {
    "auth": "ready",
    "video": "ready",
    "ai_editor": "ready",
    "analytics": "ready",
    "automation": "ready",
    "brand_kit": "ready",
    "scheduler": "ready"
  }
}
```

#### GET /api/info
API information and available modules
```bash
curl http://localhost:5000/api/info
```

**Response** (200):
```json
{
  "name": "Ultrarslanoglu API Gateway",
  "version": "2.0.0",
  "description": "Galatasaray Dijital Platform - Unified API",
  "modules": [
    {"name": "Authentication", "path": "/api/auth"},
    {"name": "Video Pipeline", "path": "/api/video"},
    ...
  ]
}
```

---

### 2️⃣ AUTHENTICATION (`/api/auth`)

#### POST /api/auth/register
Register new user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d {
    "email": "user@example.com",
    "password": "SecurePassword123",
    "name": "John Doe"
  }
```

**Request**:
```json
{
  "email": "string (required, email format)",
  "password": "string (required, min 8 chars)",
  "name": "string (required)"
}
```

**Response** (201):
```json
{
  "success": true,
  "user_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "message": "Kayıt başarılı"
}
```

**Error** (409):
```json
{
  "error": "Bu email zaten kayıtlı"
}
```

#### POST /api/auth/login
User login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d {
    "email": "user@example.com",
    "password": "SecurePassword123"
  }
```

**Request**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response** (200):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "viewer"
  }
}
```

#### POST /api/auth/logout
Logout (optional, client-side token cleanup)
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

**Response** (200):
```json
{
  "success": true,
  "message": "Oturum kapatıldı"
}
```

#### GET /api/auth/me
Get current user
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

**Response** (200):
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "viewer"
  }
}
```

#### POST /api/auth/verify-email
Verify email address
```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d {
    "user_id": "507f1f77bcf86cd799439011",
    "verification_code": "123456"
  }
```

**Response** (200):
```json
{
  "success": true,
  "message": "Email başarıyla doğrulandı"
}
```

#### POST /api/auth/password-reset
Request password reset
```bash
curl -X POST http://localhost:5000/api/auth/password-reset \
  -H "Content-Type: application/json" \
  -d {
    "email": "user@example.com"
  }
```

**Response** (200):
```json
{
  "success": true,
  "message": "Şifre sıfırlama bağlantısı gönderildi"
}
```

---

### 3️⃣ VIDEO PIPELINE (`/api/video`)

#### GET /api/video/health
Video module health check

#### POST /api/video/upload
Upload video
```bash
curl -X POST http://localhost:5000/api/video/upload \
  -H "Authorization: Bearer <token>" \
  -F "video=@/path/to/video.mp4" \
  -F "title=My Video" \
  -F "description=Video Description"
```

**Response** (201):
```json
{
  "success": true,
  "video_id": "507f1f77bcf86cd799439011",
  "filename": "video.mp4"
}
```

---

### 4️⃣ AI EDITOR (`/api/ai-editor`)

#### GET /api/ai-editor/health
AI Editor module health check

#### POST /api/ai-editor/analyze
Analyze video with AI
```bash
curl -X POST http://localhost:5000/api/ai-editor/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d {
    "video_id": "507f1f77bcf86cd799439011"
  }
```

**Response** (200):
```json
{
  "success": true,
  "analysis": "AI-generated analysis content..."
}
```

---

### 5️⃣ ANALYTICS (`/api/analytics`)

#### GET /api/analytics/health
Analytics module health check

#### POST /api/analytics/metrics
Save metric
```bash
curl -X POST http://localhost:5000/api/analytics/metrics \
  -H "Content-Type: application/json" \
  -d {
    "platform": "instagram",
    "metric_type": "views",
    "value": 1500
  }
```

**Response** (201):
```json
{
  "success": true,
  "metric_id": "507f1f77bcf86cd799439011"
}
```

#### GET /api/analytics/metrics
Get metrics
```bash
curl "http://localhost:5000/api/analytics/metrics?platform=instagram&metric_type=views&days=7&limit=100"
```

**Response** (200):
```json
{
  "success": true,
  "metrics": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "platform": "instagram",
      "metric_type": "views",
      "value": 1500,
      "created_at": "2026-01-01T12:00:00"
    }
  ]
}
```

---

### 6️⃣ AUTOMATION (`/api/automation`)

#### GET /api/automation/health
Automation module health check

#### POST /api/automation/tasks
Create automation task
```bash
curl -X POST http://localhost:5000/api/automation/tasks \
  -H "Content-Type: application/json" \
  -d {
    "task_type": "post_video",
    "parameters": {"video_id": "..."},
    "schedule": "2026-01-02T10:00:00"
  }
```

**Response** (201):
```json
{
  "success": true,
  "task_id": "507f1f77bcf86cd799439011",
  "celery_task_id": "abc-def-123"
}
```

---

### 7️⃣ BRAND KIT (`/api/brand`)

#### GET /api/brand/health
Brand Kit module health check

#### GET /api/brand/templates
List brand templates
```bash
curl "http://localhost:5000/api/brand/templates?category=video"
```

**Response** (200):
```json
{
  "success": true,
  "templates": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Template Name",
      "category": "video"
    }
  ]
}
```

#### GET /api/brand/colors
Get brand colors
```bash
curl http://localhost:5000/api/brand/colors
```

**Response** (200):
```json
{
  "success": true,
  "colors": {
    "primary": {
      "yellow": "#FFD700",
      "red": "#C8102E"
    },
    "secondary": {
      "black": "#000000",
      "white": "#FFFFFF"
    }
  }
}
```

#### GET /api/brand/fonts
Get brand fonts
```bash
curl http://localhost:5000/api/brand/fonts
```

**Response** (200):
```json
{
  "success": true,
  "fonts": {
    "primary": "Montserrat",
    "secondary": "Roboto",
    "weights": [400, 600, 700, 900]
  }
}
```

---

### 8️⃣ SCHEDULER (`/api/scheduler`)

#### GET /api/scheduler/health
Scheduler module health check

#### POST /api/scheduler/schedule
Schedule content
```bash
curl -X POST http://localhost:5000/api/scheduler/schedule \
  -H "Content-Type: application/json" \
  -d {
    "content": {"title": "Post Title", "text": "Post Content"},
    "scheduled_time": "2026-01-02T10:00:00",
    "platforms": ["instagram", "twitter"]
  }
```

**Response** (201):
```json
{
  "success": true,
  "schedule_id": "507f1f77bcf86cd799439011"
}
```

#### GET /api/scheduler/calendar
Get content calendar
```bash
curl "http://localhost:5000/api/scheduler/calendar?start_date=2026-01-01&end_date=2026-01-31"
```

**Response** (200):
```json
{
  "success": true,
  "calendar": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "content": {"title": "..."},
      "scheduled_time": "2026-01-02T10:00:00"
    }
  ]
}
```

---

## 🔄 Error Responses

### 400 Bad Request
```json
{
  "error": "Email, şifre ve ad gerekli"
}
```

### 401 Unauthorized
```json
{
  "error": "Geçersiz veya süresi dolmuş token"
}
```

### 403 Forbidden
```json
{
  "error": "Yetersiz yetki"
}
```

### 404 Not Found
```json
{
  "error": "Endpoint bulunamadı"
}
```

### 409 Conflict
```json
{
  "error": "Bu email zaten kayıtlı"
}
```

### 500 Internal Server Error
```json
{
  "error": "Sunucu hatası"
}
```

---

## 🧪 Testing with cURL

### Quick Test Script
```bash
#!/bin/bash

API="http://localhost:5000"

# Health check
echo "Testing health check..."
curl -s $API/health | jq .

# API info
echo "Testing API info..."
curl -s $API/api/info | jq .

# Module health checks
for module in auth video ai-editor analytics automation brand scheduler; do
  echo "Testing $module health..."
  curl -s $API/api/$module/health | jq .
done
```

---

## 📊 Rate Limiting

- **Default**: 100 requests per minute per IP
- **Auth endpoints**: 10 requests per minute per IP
- **Header**: `X-RateLimit-Remaining`

---

## 🔐 Security

- All passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire after 24 hours
- Sensitive endpoints require authentication
- CORS enabled for specified origins
- Input validation on all endpoints

---

**Last Updated**: 1 January 2026  
**Version**: 2.0.0  
**Status**: Active Development
