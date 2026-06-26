import rateLimit from 'express-rate-limit';

// Global rate limiter for standard endpoints (e.g. /api/health)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for sensitive actions (e.g. subscribing to push, triggering test pushes)
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per IP
  message: { error: 'Too many subscription/test requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate rate limiter for activity tracking
export const activityLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per IP
  message: { error: 'Too many activity updates. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
