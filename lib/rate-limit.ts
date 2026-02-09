import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// In-memory store (for production, use Redis like Upstash)
const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key]!.resetAt < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  interval: number; // milliseconds
  limit: number; // requests per interval
}

export const rateLimits = {
  // AI endpoints - more restrictive
  ai: {
    interval: 60 * 1000, // 1 minute
    limit: 10,
  },
  // Export endpoints - moderate
  export: {
    interval: 60 * 1000, // 1 minute
    limit: 5,
  },
  // Mutation endpoints (POST, PUT, DELETE)
  mutation: {
    interval: 60 * 1000, // 1 minute
    limit: 30,
  },
  // Read endpoints (GET)
  read: {
    interval: 60 * 1000, // 1 minute
    limit: 100,
  },
};

/**
 * Rate limit middleware
 * Returns null if allowed, or Response object if rate limited
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<Response | null> {
  // Get identifier (IP address or user ID from auth header)
  const identifier = getIdentifier(request);
  const key = `${identifier}:${request.nextUrl.pathname}`;
  
  const now = Date.now();
  const record = store[key];

  if (!record || record.resetAt < now) {
    // Create new record
    store[key] = {
      count: 1,
      resetAt: now + config.interval,
    };
    return null;
  }

  if (record.count < config.limit) {
    // Increment count
    record.count++;
    return null;
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil((record.resetAt - now) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': config.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': record.resetAt.toString(),
      },
    }
  );
}

function getIdentifier(request: NextRequest): string {
  // Try to get user ID from auth header (once they're authenticated)
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // Use auth token as identifier (hashed for privacy)
    return hashString(authHeader);
  }
  
  // Fallback to IP address
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';
  
  return ip;
}

// Simple hash function for identifiers
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Helper function to check rate limit based on type
 */
export async function checkRateLimit(
  request: NextRequest,
  type: keyof typeof rateLimits
): Promise<Response | null> {
  return rateLimit(request, rateLimits[type]);
}
