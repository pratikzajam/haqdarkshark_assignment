import { ZodError } from 'zod';
import mongoose from 'mongoose';

/**
 * Centralized Error Handling Middleware for Express
 * Sanitizes errors, formats validation messages, and prevents credential/stack leak.
 */
export function errorHandler(err, req, res, next) {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors
    });
  }

  // 2. Mongoose Invalid ObjectId Cast Error
  if (err instanceof mongoose.Error.CastError && err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      error: `Invalid identifier format: ${err.value}`
    });
  }

  // 3. Mongoose Validation Error
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Database validation failed',
      details: messages
    });
  }

  // 4. Duplicate Key Error (MongoDB E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: `A record with this ${field} already exists`
    });
  }

  // 5. Gemini / External API Errors
  if (err.status === 429 || err.message?.includes('RESOURCE_EXHAUSTED')) {
    return res.status(429).json({
      success: false,
      error: 'AI service rate limit exceeded. Please retry shortly.'
    });
  }

  // 6. Generic Internal Server Error
  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error('[Unhandled Server Error]:', err.message);

  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(isProduction ? {} : { stack: err.stack })
  });
}
