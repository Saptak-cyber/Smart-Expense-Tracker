# Rate Limiting Guide

## Overview

Your application has comprehensive rate limiting implemented to protect against abuse and manage API costs, especially for AI-powered features.

## Current Rate Limits

### AI Endpoints (OCR & AI Insights)

- **Limit**: 10 requests per minute
- **Applies to**:
  - `/api/receipts/upload` (Receipt OCR using Groq Vision)
  - `/api/analytics/ai-insights` (AI insights using GPT-OSS-120B)
  - `/api/ai/chat` (Chatbot using Gemini)

### Export Endpoints

- **Limit**: 5 requests per minute
- **Applies to**:
  - `/api/export` (PDF/Excel exports)

### Mutation Endpoints (POST, PUT, DELETE)

- **Limit**: 30 requests per minute
- **Applies to**:
  - `/api/categories` (Create/Update/Delete categories)
  - `/api/expenses` (Create/Update/Delete expenses)
  - `/api/budgets` (Create/Update/Delete budgets)
  - `/api/recurring-expenses` (Create/Update/Delete recurring expenses)

### Read Endpoints (GET)

- **Limit**: 100 requests per minute
- **Applies to**:
  - Most GET endpoints for fetching data

## How It Works

### Identification

Rate limits are tracked per user using:

1. **Authentication token** (for logged-in users) - hashed for privacy
2. **IP address** (fallback for unauthenticated requests)

### Storage

- **Development**: In-memory store (resets on server restart)
- **Production**: Consider using Redis (e.g., Upstash) for distributed rate limiting

### Response Headers

When rate limited, the API returns:

- **Status**: 429 (Too Many Requests)
- **Headers**:
  - `Retry-After`: Seconds until limit resets
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining (0 when limited)
  - `X-RateLimit-Reset`: Timestamp when limit resets

### Example Response

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 45
}
```

## Protected Endpoints

### ✅ Receipt OCR (`/api/receipts/upload`)

- **Rate Limit**: 30 requests/minute (mutation type)
- **Why**: Prevents abuse of Groq Vision API
- **Cost Impact**: Each request uses Groq API credits

### ✅ AI Insights (`/api/analytics/ai-insights`)

- **Rate Limit**: 10 requests/minute (AI type)
- **Why**: Prevents excessive use of GPT-OSS-120B reasoning model
- **Cost Impact**: Each request uses Groq API credits and reasoning tokens

### ✅ AI Chat (`/api/ai/chat`)

- **Rate Limit**: 10 requests/minute (AI type)
- **Why**: Prevents chatbot spam
- **Cost Impact**: Each request uses Gemini API credits

## Frontend Handling

### Current Implementation

The frontend does not currently handle rate limit errors explicitly. When a 429 response is received, it will show a generic error toast.

### Recommended Improvements

Consider adding:

1. **Retry logic** with exponential backoff
2. **User-friendly messages** showing retry time
3. **Button disable states** during rate limit cooldown
4. **Visual countdown** showing when user can retry

### Example Frontend Code

```typescript
async function generateAIInsights() {
  try {
    const response = await fetch('/api/analytics/ai-insights', {
      method: 'POST',
      // ... other options
    });

    if (response.status === 429) {
      const data = await response.json();
      const retryAfter = data.retryAfter || 60;
      toast.error(`Too many requests. Please wait ${retryAfter} seconds.`);

      // Optionally disable button and show countdown
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), retryAfter * 1000);
      return;
    }

    // ... handle success
  } catch (error) {
    // ... handle error
  }
}
```

## Configuration

### Adjusting Limits

Edit `lib/rate-limit.ts`:

```typescript
export const rateLimits = {
  ai: {
    interval: 60 * 1000, // 1 minute
    limit: 10, // Adjust this number
  },
  // ... other limits
};
```

### Adding New Rate Limits

1. Add new config to `rateLimits` object
2. Import and apply in your API route:

```typescript
import { rateLimit, rateLimits } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimits.ai);
  if (rateLimitResult) return rateLimitResult;

  // ... rest of your handler
}
```

## Production Considerations

### Current Limitations

- **In-memory storage**: Limits reset on server restart
- **Single instance**: Won't work across multiple server instances
- **No persistence**: No historical tracking

### Recommended Upgrades

1. **Use Redis** (e.g., Upstash, Redis Cloud):

   ```typescript
   import { Redis } from '@upstash/redis';
   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_REST_URL,
     token: process.env.UPSTASH_REDIS_REST_TOKEN,
   });
   ```

2. **Use Vercel Rate Limiting** (if deployed on Vercel):
   - Built-in edge rate limiting
   - Distributed across all edge locations
   - No additional setup required

3. **Use dedicated rate limiting service**:
   - Upstash Rate Limit
   - Redis Rate Limiter
   - API Gateway rate limiting

## Monitoring

### What to Track

- Rate limit hits per endpoint
- Users hitting limits frequently
- Peak usage times
- API cost correlation

### Logging

Add logging to track rate limit events:

```typescript
if (record.count >= config.limit) {
  console.warn('Rate limit exceeded', {
    identifier,
    endpoint: request.nextUrl.pathname,
    limit: config.limit,
  });
}
```

## Cost Protection

### Why Rate Limiting Matters

1. **Groq API Costs**: Each AI request costs money
2. **Abuse Prevention**: Prevents malicious users from draining credits
3. **Fair Usage**: Ensures all users get reasonable access
4. **Budget Control**: Keeps API costs predictable

### Current Protection

- **OCR**: Max 30 receipts per minute per user
- **AI Insights**: Max 10 generations per minute per user
- **Chatbot**: Max 10 messages per minute per user

### Estimated Costs (Example)

If a user hits all limits:

- 30 OCR requests/min = ~1,800/hour
- 10 AI insights/min = ~600/hour
- 10 chat messages/min = ~600/hour

With rate limiting, costs are bounded and predictable.

## Testing Rate Limits

### Manual Testing

```bash
# Test AI insights endpoint
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/analytics/ai-insights \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"categoryBreakdown":[],"monthlyTrends":[]}'
  echo "Request $i"
  sleep 1
done
```

### Expected Behavior

- Requests 1-10: Success (200)
- Requests 11+: Rate limited (429)
- After 60 seconds: Limit resets

## Summary

✅ **OCR Endpoint**: Protected with 30 req/min limit
✅ **AI Insights Endpoint**: Protected with 10 req/min limit  
✅ **Chatbot Endpoint**: Protected with 10 req/min limit
✅ **Export Endpoint**: Protected with 5 req/min limit
✅ **Mutation Endpoints**: Protected with 30 req/min limit
✅ **Read Endpoints**: Protected with 100 req/min limit

Your application is well-protected against abuse and excessive API costs!
