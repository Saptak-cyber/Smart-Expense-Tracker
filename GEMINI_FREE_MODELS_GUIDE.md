# Google Gemini Free Models Guide (2026)

Based on official Google AI documentation: https://ai.google.dev/pricing

## Free Tier Models Available

As of February 2026, Google offers several models completely **FREE** with no credit card required:

### 1. **Gemini 3 Flash** (Preview Only - Not Recommended Yet)
- **Model Name:** `gemini-3-flash-preview`
- **Status:** ⚠️ Preview only - not stable for production
- **Free Tier:** ✅ Yes - Free of charge
- **Best For:** Testing new features
- **Note:** Use `gemini-2.5-flash` instead for production

### 2. **Gemini 2.5 Flash** ⭐ RECOMMENDED FOR YOUR CHATBOT
- **Model Name:** `gemini-2.5-flash`
- **Free Tier:** ✅ Yes - Free of charge (STABLE)
- **Best For:** Production chatbots, balanced speed and quality
- **Input:** Free
- **Output:** Free
- **Context Window:** 1 million tokens
- **Rate Limits (Free):**
  - 15 RPM (Requests Per Minute)
  - 500 RPD (Requests Per Day)
  - 250,000 TPM (Tokens Per Minute)
- **Latest Update:** June 2025
- **Status:** ✅ Stable and production-ready

### 3. **Gemini 2.5 Pro**
- **Model Name:** `gemini-2.5-pro`
- **Free Tier:** ✅ Yes - Free of charge (STABLE)
- **Best For:** Complex reasoning, analysis
- **Input:** Free
- **Output:** Free
- **Context Window:** 1 million tokens
- **Rate Limits (Free):**
  - 5 RPM
  - 100 RPD
  - 250,000 TPM
- **Latest Update:** June 2025
- **Status:** ✅ Stable

### 4. **Gemini 2.5 Flash-Lite** (Highest Throughput)
- **Model Name:** `gemini-2.5-flash-lite`
- **Free Tier:** ✅ Yes - Free of charge (STABLE)
- **Best For:** High-throughput, cost-sensitive tasks
- **Input:** Free
- **Output:** Free
- **Rate Limits (Free):**
  - 15 RPM
  - 1,000 RPD (highest!)
  - 250,000 TPM
- **Latest Update:** July 2025
- **Status:** ✅ Stable

### 5. **Gemini 2.0 Flash** (Deprecated - Your Old Model)
- **Model Name:** `gemini-2.0-flash`
- **Free Tier:** ✅ Yes - Free of charge
- **Best For:** Multimodal tasks, agents
- **Input:** Free
- **Output:** Free
- **⚠️ WARNING:** Will be shut down on March 31, 2026
- **Recommendation:** Migrate to `gemini-2.5-flash`


### 6. **Gemma 3** (Open Source)
- **Model Name:** `gemma-3`
- **Free Tier:** ✅ Yes - Free of charge (always free)
- **Best For:** Lightweight tasks, privacy-focused
- **Input:** Free
- **Output:** Free

---

## Models NOT Available in Free Tier

❌ **Gemini 3 Pro** - Paid only ($2-$4 per 1M input tokens)
❌ **Gemini 3 Pro Preview** - Paid only
❌ **Imagen 4** - Paid only (image generation)
❌ **Veo 3** - Paid only (video generation)

---

## Recommendation for Your Expense Tracker Chatbot

### Best Choice: **Gemini 2.5 Flash** (`gemini-2.5-flash`) ⭐

**Why?**
1. ✅ **Completely Free** - No charges for input or output
2. ✅ **Stable & Production-Ready** - Not a preview/experimental version
3. ✅ **Good Rate Limits** - 500 requests per day is sufficient for most users
4. ✅ **Fast Response** - Optimized for speed
5. ✅ **High Quality** - Latest stable model from Google
6. ✅ **1M Token Context** - Can handle large financial data
7. ✅ **Updated June 2025** - Most recent stable release

**Alternative:** If you need even more requests per day, use **Gemini 2.5 Flash-Lite** (1,000 RPD)

---

## Current vs Recommended Model

### Your Old Code (Deprecated):
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
// ⚠️ This model will be shut down on March 31, 2026
```

### ✅ Updated Code (Now in your project):
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
// ✅ Stable, production-ready, 500 RPD
```

**OR** for highest throughput:
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
// ✅ Stable, 1,000 RPD (highest free quota)
```

---

## ⚠️ Important: Gemini 3 Models Are Preview Only

**Why you got the 404 error:**

Gemini 3 models (`gemini-3-flash`, `gemini-3-pro`) are currently **preview only** and use different model names:
- ❌ `gemini-3-flash` - Does NOT exist
- ✅ `gemini-3-flash-preview` - Preview version (not recommended for production)

**The correct stable models to use are:**
- ✅ `gemini-2.5-flash` - Stable, production-ready (RECOMMENDED)
- ✅ `gemini-2.5-flash-lite` - Stable, highest throughput
- ✅ `gemini-2.5-pro` - Stable, best for complex reasoning

**When Gemini 3 becomes stable:**
Google will announce when Gemini 3 models are production-ready. Until then, stick with the 2.5 series.

---

## Free Tier Limitations (Important!)

### What's Included:
- ✅ Free input and output tokens
- ✅ Commercial use allowed
- ✅ 1 million token context window
- ✅ Multimodal support (text, images, audio, video)
- ✅ Google AI Studio access

### What's NOT Included:
- ❌ No SLA (Service Level Agreement)
- ❌ No guaranteed uptime
- ❌ Google can change limits without notice
- ❌ Your data may be used to improve Google's products
- ❌ Context caching not available on free tier
- ❌ Batch API not available on free tier

### Rate Limit Notes:
- Limits are **per project**, not per API key
- Creating multiple API keys in same project won't increase quota
- Creating separate Google Cloud projects gives independent quotas
- Limits reset at midnight Pacific Time

---

## When to Upgrade to Paid Tier

Consider upgrading if:
- You exceed 250 requests per day consistently
- You need guaranteed uptime (SLA)
- You want your data NOT used for training
- You need context caching for cost optimization
- You need batch processing (50% cost reduction)
- You need access to Gemini 3 Pro

**Paid Tier Costs:**
- Gemini 3 Flash: $0.50 per 1M input tokens, $3.00 per 1M output tokens
- Gemini 2.5 Flash-Lite: $0.10 per 1M input tokens, $0.40 per 1M output tokens

---

## Implementation Guide

### Step 1: Update Your Model
Edit `lib/gemini.ts`:

```typescript
export async function generateInsight(prompt: string): Promise<string> {
  // Change from 'gemini-2.0-flash' to 'gemini-3-flash'
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash' });
  
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}
```

### Step 2: Test the Change
```bash
# No code changes needed in your API route
# Just update the model name in lib/gemini.ts
```

### Step 3: Monitor Usage
- Check your usage at: https://aistudio.google.com
- Monitor rate limit errors (429 status codes)
- Track daily request counts

---

## Rate Limit Handling

Your current code already has rate limiting in place:

```typescript
// In app/api/ai/chat/route.ts
const rateLimitResult = await rateLimit(request, rateLimits.ai);
if (rateLimitResult) return rateLimitResult;
```

This protects against hitting Google's limits too quickly.

---

## Cost Comparison (If You Upgrade Later)

For a typical expense tracker chatbot query:
- Average prompt: ~2,000 tokens (user data + question)
- Average response: ~500 tokens

**Free Tier:**
- Cost: $0.00
- Limit: 250 requests/day

**Paid Tier (Gemini 3 Flash):**
- Cost per query: ~$0.00175 ($0.001 input + $0.0015 output)
- 1,000 queries: ~$1.75
- 10,000 queries: ~$17.50

**Paid Tier (Gemini 2.5 Flash-Lite - cheapest):**
- Cost per query: ~$0.0004 ($0.0002 input + $0.0002 output)
- 1,000 queries: ~$0.40
- 10,000 queries: ~$4.00

---

## Summary

✅ **Your current model (`gemini-2.0-flash`) is FREE**
✅ **Recommended upgrade: `gemini-3-flash` (newer, better, still FREE)**
✅ **Alternative: `gemini-2.5-flash-lite` (highest free quota: 1,000 RPD)**
✅ **No credit card required for free tier**
✅ **Perfect for your expense tracker chatbot**

---

## References

- Official Pricing: https://ai.google.dev/pricing
- API Documentation: https://ai.google.dev/docs
- Rate Limits: https://ai.google.dev/docs/rate_limits
- Google AI Studio: https://aistudio.google.com

**Last Updated:** February 14, 2026
