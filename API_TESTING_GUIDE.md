# API Testing Guide - Postman & cURL

Complete guide for testing all backend endpoints in your expense tracker application.

## Table of Contents
1. [Authentication Setup](#authentication-setup)
2. [Health Check](#health-check)
3. [Expenses API](#expenses-api)
4. [Budgets API](#budgets-api)
5. [Categories API](#categories-api)
6. [Analytics API](#analytics-api)
7. [Alerts API](#alerts-api)
8. [Profile API](#profile-api)
9. [Recurring Expenses API](#recurring-expenses-api)
10. [Export API](#export-api)
11. [AI Chat API](#ai-chat-api)
12. [Chat History API](#chat-history-api)
13. [Receipts API](#receipts-api)
14. [Cron Jobs API](#cron-jobs-api)

## Authentication Setup

All endpoints (except health check and categories GET) require authentication. You need to include the JWT token in the Authorization header.

### Getting Your Auth Token

1. Login to your application
2. Open browser DevTools → Application → Local Storage
3. Find the Supabase auth token
4. Copy the `access_token` value

### Setting Up in Postman

1. Create a new Environment in Postman
2. Add variables:
   - `base_url`: `http://localhost:3000` (or your deployed URL)
   - `auth_token`: Your JWT token from Supabase

3. In your requests, use:
   - URL: `{{base_url}}/api/...`
   - Header: `Authorization: Bearer {{auth_token}}`

---

## 1. Health Check

### GET /api/health

Check if the API is running.

**cURL:**
```bash
curl -X GET http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-14T10:30:00.000Z",
  "uptime": 12345.67
}
```

---

## 2. Expenses API

### GET /api/expenses

Fetch all expenses for the authenticated user with optional filters.

**Query Parameters:**
- `start_date` (optional): Filter by start date (YYYY-MM-DD)
- `end_date` (optional): Filter by end date (YYYY-MM-DD)
- `cursor` (optional): Pagination cursor
- `limit` (optional): Number of results (default: 50)

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/expenses?start_date=2026-01-01&end_date=2026-02-14&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Postman:**
- Method: `GET`
- URL: `{{base_url}}/api/expenses`
- Headers: `Authorization: Bearer {{auth_token}}`
- Params: `start_date=2026-01-01`, `end_date=2026-02-14`, `limit=20`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "amount": "150.50",
      "category_id": "uuid",
      "description": "Grocery shopping",
      "date": "2026-02-10",
      "created_at": "2026-02-10T10:30:00.000Z",
      "categories": {
        "id": "uuid",
        "name": "Food",
        "icon": "🍔"
      }
    }
  ],
  "pagination": {
    "cursor": "2026-02-10T10:30:00.000Z",
    "hasMore": true,
    "total": 150
  }
}
```

### POST /api/expenses

Create a new expense.

**Request Body:**
```json
{
  "amount": 150.50,
  "category_id": "uuid-of-category",
  "description": "Grocery shopping at Walmart",
  "date": "2026-02-14"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.50,
    "category_id": "your-category-uuid",
    "description": "Grocery shopping",
    "date": "2026-02-14"
  }'
```

**Postman:**
- Method: `POST`
- URL: `{{base_url}}/api/expenses`
- Headers: 
  - `Authorization: Bearer {{auth_token}}`
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "amount": 150.50,
  "category_id": "your-category-uuid",
  "description": "Grocery shopping",
  "date": "2026-02-14"
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "amount": "150.50",
  "category_id": "uuid",
  "description": "Grocery shopping",
  "date": "2026-02-14",
  "created_at": "2026-02-14T10:30:00.000Z"
}
```

### PUT /api/expenses

Update an existing expense.

**Request Body:**
```json
{
  "id": "expense-uuid",
  "amount": 175.00,
  "description": "Updated description",
  "date": "2026-02-14"
}
```

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "expense-uuid",
    "amount": 175.00,
    "description": "Updated grocery shopping"
  }'
```

**Response:** Updated expense object with categories included.

### DELETE /api/expenses

Delete an expense.

**Query Parameters:**
- `id` (required): Expense ID to delete

**cURL:**
```bash
curl -X DELETE "http://localhost:3000/api/expenses?id=expense-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Postman:**
- Method: `DELETE`
- URL: `{{base_url}}/api/expenses?id=expense-uuid`
- Headers: `Authorization: Bearer {{auth_token}}`

**Response:**
```json
{
  "success": true
}
```

---

## 3. Budgets API

### GET /api/budgets

Fetch all budgets for the authenticated user.

**Query Parameters:**
- `month` (optional): Filter by month (1-12)
- `year` (optional): Filter by year (YYYY)

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/budgets?month=2&year=2026" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "category_id": "uuid",
    "monthly_limit": "5000.00",
    "month": 2,
    "year": 2026,
    "created_at": "2026-02-01T00:00:00.000Z",
    "categories": {
      "id": "uuid",
      "name": "Food",
      "icon": "🍔"
    }
  }
]
```

### POST /api/budgets

Create a new budget.

**Request Body:**
```json
{
  "category_id": "uuid",
  "monthly_limit": 5000,
  "month": 2,
  "year": 2026
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/budgets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "category-uuid",
    "monthly_limit": 5000,
    "month": 2,
    "year": 2026
  }'
```

**Response:** Created budget object with category details.

**Error Response (Duplicate):**
```json
{
  "error": "Budget for this category and month already exists"
}
```

### PUT /api/budgets

Update an existing budget.

**Request Body:**
```json
{
  "id": "budget-uuid",
  "monthly_limit": 6000
}
```

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/budgets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "budget-uuid",
    "monthly_limit": 6000
  }'
```

### DELETE /api/budgets

Delete a budget.

**cURL:**
```bash
curl -X DELETE "http://localhost:3000/api/budgets?id=budget-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "success": true
}
```

---

## 4. Categories API

### GET /api/categories

Fetch all categories (public endpoint, no auth required).

**cURL:**
```bash
curl -X GET http://localhost:3000/api/categories
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Food",
    "icon": "🍔",
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid",
    "name": "Transportation",
    "icon": "🚗",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
]
```

### POST /api/categories

Create a new category (requires authentication and service role).

**Request Body:**
```json
{
  "name": "Entertainment",
  "icon": "🎬"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Entertainment",
    "icon": "🎬"
  }'
```

---

## 5. Analytics API

### GET /api/analytics

Fetch analytics data by type.

**Query Parameters:**
- `type` (required): `monthly` or `categories`

**cURL (Monthly Summary):**
```bash
curl -X GET "http://localhost:3000/api/analytics?type=monthly" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response (Monthly):**
```json
[
  {
    "month": "2026-02",
    "total_amount": "15000.50",
    "expense_count": 45
  }
]
```

**cURL (Category Breakdown):**
```bash
curl -X GET "http://localhost:3000/api/analytics?type=categories" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response (Categories):**
```json
[
  {
    "category_name": "Food",
    "total_amount": "8000.00",
    "expense_count": 25
  }
]
```

### GET /api/analytics/detailed

Fetch detailed analytics with insights.

**Query Parameters:**
- `months` (optional): Number of months to analyze (default: 6)

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/analytics/detailed?months=6" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "monthlyTrends": [
    {
      "month": "Jan 2026",
      "total": 12500.50
    }
  ],
  "categoryBreakdown": [
    {
      "name": "Food",
      "value": 8000.00,
      "percentage": 45.5
    }
  ],
  "topMerchants": [
    {
      "merchant": "Walmart",
      "amount": 3500.00,
      "count": 12,
      "trend": "neutral"
    }
  ],
  "budgetPerformance": [
    {
      "category": "Food",
      "limit": 5000.00,
      "spent": 4500.00,
      "remaining": 500.00,
      "percentage": 90.0,
      "status": "warning"
    }
  ],
  "insights": [
    {
      "type": "info",
      "title": "Daily Average",
      "description": "You spend an average of ₹416.68 per day"
    }
  ],
  "summary": {
    "totalExpenses": 150,
    "totalSpent": 12500.50,
    "avgPerExpense": 83.34,
    "avgDaily": 416.68
  }
}
```

---

## 6. Alerts API

### GET /api/alerts

Fetch alerts for the authenticated user.

**Query Parameters:**
- `unread_only` (optional): `true` to fetch only unread alerts

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/alerts?unread_only=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "type": "budget_exceeded",
    "title": "Budget Exceeded",
    "message": "You've exceeded your budget for this category by ₹500.00",
    "severity": "warning",
    "is_read": false,
    "created_at": "2026-02-14T10:30:00.000Z"
  }
]
```

### PATCH /api/alerts

Mark an alert as read/unread.

**Request Body:**
```json
{
  "alert_id": "uuid",
  "is_read": true
}
```

**cURL:**
```bash
curl -X PATCH http://localhost:3000/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_id": "alert-uuid",
    "is_read": true
  }'
```

### DELETE /api/alerts

Delete an alert.

**cURL:**
```bash
curl -X DELETE "http://localhost:3000/api/alerts?id=alert-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 7. Profile API

### GET /api/profile

Fetch user profile.

**cURL:**
```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "currency": "INR",
  "notification_preferences": {
    "email": true,
    "push": false
  },
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

### PATCH /api/profile

Update user profile settings.

**Request Body:**
```json
{
  "full_name": "John Smith",
  "currency": "USD",
  "notification_preferences": {
    "email": true,
    "push": true
  }
}
```

**cURL:**
```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Smith",
    "currency": "USD"
  }'
```

---

## 8. Recurring Expenses API

### GET /api/recurring-expenses

Fetch all recurring expenses.

**cURL:**
```bash
curl -X GET http://localhost:3000/api/recurring-expenses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "category_id": "uuid",
    "amount": "1200.00",
    "description": "Netflix Subscription",
    "frequency": "monthly",
    "start_date": "2026-01-01",
    "end_date": null,
    "next_occurrence": "2026-03-01",
    "is_active": true,
    "categories": {
      "id": "uuid",
      "name": "Entertainment",
      "icon": "🎬"
    }
  }
]
```

### POST /api/recurring-expenses

Create a new recurring expense.

**Request Body:**
```json
{
  "category_id": "uuid",
  "amount": 1200,
  "description": "Netflix Subscription",
  "frequency": "monthly",
  "start_date": "2026-02-01",
  "end_date": null
}
```

**Frequency Options:** `daily`, `weekly`, `monthly`, `yearly`

**cURL:**
```bash
curl -X POST http://localhost:3000/api/recurring-expenses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "category-uuid",
    "amount": 1200,
    "description": "Netflix Subscription",
    "frequency": "monthly",
    "start_date": "2026-02-01"
  }'
```

### PUT /api/recurring-expenses

Update a recurring expense.

**Request Body:**
```json
{
  "id": "recurring-expense-uuid",
  "amount": 1500,
  "is_active": false
}
```

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/recurring-expenses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "recurring-expense-uuid",
    "amount": 1500
  }'
```

### DELETE /api/recurring-expenses

Delete a recurring expense.

**cURL:**
```bash
curl -X DELETE "http://localhost:3000/api/recurring-expenses?id=recurring-expense-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 9. Export API

### POST /api/export

Export expenses to CSV format.

**Request Body:**
```json
{
  "format": "csv",
  "start_date": "2026-01-01",
  "end_date": "2026-02-14",
  "category_ids": ["uuid1", "uuid2"]
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/export \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "start_date": "2026-01-01",
    "end_date": "2026-02-14"
  }' \
  --output expenses.csv
```

**Postman:**
- Method: `POST`
- URL: `{{base_url}}/api/export`
- Headers: 
  - `Authorization: Bearer {{auth_token}}`
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "format": "csv",
  "start_date": "2026-01-01",
  "end_date": "2026-02-14"
}
```
- Click "Send and Download" to save the CSV file

**Response:** CSV file download

---

## 10. AI Chat API

### POST /api/ai/chat

Chat with AI assistant about your finances.

**Request Body:**
```json
{
  "query": "How can I reduce my food expenses?",
  "start_date": "2026-01-01",
  "end_date": "2026-02-14"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How can I reduce my food expenses?",
    "start_date": "2026-01-01",
    "end_date": "2026-02-14"
  }'
```

**Response:**
```json
{
  "response": "Based on your spending patterns, here are some suggestions to reduce food expenses: 1. You're spending an average of ₹8000/month on food. Consider meal planning to reduce impulse purchases. 2. Your top merchant is Walmart with 12 transactions. Try buying in bulk to save money..."
}
```

**Note:** Requires `GEMINI_API_KEY` environment variable to be set.

---

## 11. Chat History API

### GET /api/chat-history

Fetch chat history with AI assistant.

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/chat-history?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "role": "user",
    "content": "How can I reduce my food expenses?",
    "metadata": {},
    "created_at": "2026-02-14T10:30:00.000Z"
  },
  {
    "id": "uuid",
    "user_id": "uuid",
    "role": "assistant",
    "content": "Based on your spending patterns...",
    "metadata": {},
    "created_at": "2026-02-14T10:30:05.000Z"
  }
]
```

### POST /api/chat-history

Add a message to chat history.

**Request Body:**
```json
{
  "role": "user",
  "content": "What's my total spending this month?",
  "metadata": {}
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/chat-history \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "content": "What is my total spending this month?"
  }'
```

### DELETE /api/chat-history

Clear all chat history.

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/chat-history \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "message": "Chat history cleared"
}
```

---

## 12. Receipts API

### POST /api/receipts/upload

Upload a receipt image with OCR processing.

**Request:** Multipart form data with file

**cURL:**
```bash
curl -X POST http://localhost:3000/api/receipts/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/receipt.jpg"
```

**Postman:**
- Method: `POST`
- URL: `{{base_url}}/api/receipts/upload`
- Headers: `Authorization: Bearer {{auth_token}}`
- Body: 
  - Select "form-data"
  - Key: `file` (change type to "File")
  - Value: Select your receipt image

**Supported Formats:** JPEG, PNG, PDF (max 5MB)

**Response:**
```json
{
  "url": "https://your-supabase-url/storage/v1/object/public/receipts/user-id/timestamp_receipt.jpg",
  "fileName": "user-id/timestamp_receipt.jpg",
  "ocr": {
    "amount": 150.50,
    "date": "2026-02-14",
    "merchant": "Walmart Supercenter"
  }
}
```

### DELETE /api/receipts/upload

Delete a receipt.

**Query Parameters:**
- `fileName` (required): File name from upload response

**cURL:**
```bash
curl -X DELETE "http://localhost:3000/api/receipts/upload?fileName=user-id/timestamp_receipt.jpg" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "message": "Receipt deleted successfully"
}
```

---

## 13. Cron Jobs API

### GET /api/cron/process-recurring

Process recurring expenses (automated cron job).

**Authorization:** Requires `CRON_SECRET` in Authorization header

**cURL:**
```bash
curl -X GET http://localhost:3000/api/cron/process-recurring \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Response:**
```json
{
  "success": true,
  "processed": 5,
  "errors": 0,
  "total": 5,
  "details": [
    {
      "id": "uuid",
      "status": "success",
      "nextOccurrence": "2026-03-14"
    }
  ]
}
```

**Note:** This endpoint is typically called by Vercel Cron, not manually.

---

## Common Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message",
  "issues": [
    {
      "field": "amount",
      "message": "Amount must be a positive number"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Rate Limits

- **Mutations** (POST, PUT, DELETE): Standard rate limit
- **AI Chat**: Lower rate limit (AI operations are expensive)
- **Export**: Lower rate limit (resource-intensive)

---

## Testing Tips

1. **Get Category IDs First**: Call `GET /api/categories` to get valid category UUIDs before creating expenses or budgets.

2. **Use Environment Variables**: In Postman, create environments for development, staging, and production with different `base_url` and `auth_token` values.

3. **Test Authentication**: Always test with and without auth tokens to verify security.

4. **Test Validation**: Try sending invalid data to ensure validation works correctly.

5. **Test Pagination**: For expenses, test with different `limit` and `cursor` values.

6. **Test Date Ranges**: Use various date ranges to ensure filtering works correctly.

7. **Monitor Rate Limits**: If you get 429 errors, wait before retrying.

---

## Postman Collection

You can import this as a Postman collection by creating a new collection and adding all these requests with the appropriate methods, URLs, headers, and bodies.

### Quick Setup Steps:
1. Create a new Collection in Postman
2. Create an Environment with `base_url` and `auth_token`
3. Add each endpoint as a request in the collection
4. Use `{{base_url}}` and `{{auth_token}}` variables
5. Save and share with your team

---

## Additional Resources

- **Supabase Documentation**: For understanding RLS policies and authentication
- **Next.js API Routes**: For understanding the routing structure
- **Rate Limiting**: Check `lib/rate-limit.ts` for rate limit configurations
- **Validation Schemas**: Check `lib/validations.ts` for request body schemas

---

**Last Updated:** February 14, 2026
