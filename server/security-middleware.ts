import { Request, Response, NextFunction } from 'express';

/**
 * 🛡️ SECURITY MIDDLEWARE FOR ADMIN ENDPOINTS
 * 
 * Protects sensitive admin functionality from unauthorized access
 */

/**
 * 🔐 ADMIN AUTHENTICATION MIDDLEWARE
 * Protects admin endpoints with environment-based API key authentication
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Multiple authentication methods for flexibility
    
    // Method 1: Environment-based API key
    const adminApiKey = process.env.ADMIN_API_KEY || process.env.SESSION_SECRET;
    if (!adminApiKey) {
      console.error('🚨 SECURITY: No admin API key configured');
      return res.status(500).json({ 
        error: 'Server configuration error - admin access unavailable' 
      });
    }

    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token === adminApiKey) {
        console.log(`✅ Admin access granted via Bearer token for ${req.method} ${req.path}`);
        return next();
      }
    }

    // Check x-admin-key header
    const adminKeyHeader = req.headers['x-admin-key'] as string;
    if (adminKeyHeader === adminApiKey) {
      console.log(`✅ Admin access granted via x-admin-key for ${req.method} ${req.path}`);
      return next();
    }

    // Check query parameter (less secure, for development only)
    if (process.env.NODE_ENV === 'development') {
      const queryKey = req.query.admin_key as string;
      if (queryKey === adminApiKey) {
        console.log(`⚠️ Admin access granted via query param (dev only) for ${req.method} ${req.path}`);
        return next();
      }
    }

    // Method 2: Development environment bypass
    if (process.env.NODE_ENV === 'development' && 
        process.env.DISABLE_ADMIN_AUTH === 'true') {
      console.log(`⚠️ Admin access bypassed (development mode) for ${req.method} ${req.path}`);
      return next();
    }

    // All authentication methods failed
    console.log(`🚨 Unauthorized admin access attempt: ${req.method} ${req.path} from ${req.ip}`);
    console.log(`   Headers: ${JSON.stringify(req.headers.authorization ? '[REDACTED]' : 'none')}`);
    
    return res.status(401).json({
      error: 'Unauthorized - Admin access required',
      code: 'ADMIN_AUTH_REQUIRED',
      message: 'Please provide valid admin credentials'
    });

  } catch (error) {
    console.error('🚨 Security middleware error:', error);
    return res.status(500).json({
      error: 'Security check failed',
      code: 'SECURITY_ERROR'
    });
  }
}

/**
 * 🚦 RATE LIMITING MIDDLEWARE
 * Prevents abuse of admin endpoints
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(windowMs: number = 60000, maxRequests: number = 10) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, value] of Array.from(rateLimitMap.entries())) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
    
    // Check current client
    const clientData = rateLimitMap.get(clientId);
    
    if (!clientData) {
      // First request from this client
      rateLimitMap.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (now > clientData.resetTime) {
      // Window expired, reset
      rateLimitMap.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      // Rate limit exceeded
      console.log(`🚨 Rate limit exceeded for ${clientId}: ${req.method} ${req.path}`);
      return res.status(429).json({
        error: 'Too Many Requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Maximum ${maxRequests} requests per ${windowMs / 1000} seconds exceeded`,
        resetTime: clientData.resetTime
      });
    }
    
    // Increment counter
    clientData.count++;
    next();
  };
}

/**
 * 🔍 AUDIT LOGGING MIDDLEWARE
 * Logs all admin actions for security monitoring
 */
export function auditLog(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Capture response details
  const originalSend = res.send;
  let responseBody: any;
  
  res.send = function(body) {
    responseBody = body;
    return originalSend.call(this, body);
  };
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      query: req.query,
      // Don't log sensitive data in body
      bodyKeys: req.body ? Object.keys(req.body) : [],
      success: res.statusCode < 400
    };
    
    if (res.statusCode >= 400) {
      console.error(`🚨 ADMIN AUDIT [FAILED]:`, JSON.stringify(logData, null, 2));
    } else {
      console.log(`📋 ADMIN AUDIT [SUCCESS]:`, JSON.stringify(logData, null, 2));
    }
  });
  
  next();
}

/**
 * 🛡️ COMPLETE ADMIN PROTECTION
 * Combines all security measures
 */
export function protectAdminEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    // Apply all security layers in sequence
    auditLog(req, res, () => {
      rateLimit(60000, 5)(req, res, () => { // 5 requests per minute
        requireAdminAuth(req, res, next);
      });
    });
  } catch (error) {
    console.error(`🚨 SECURITY: Error in protectAdminEndpoint for ${req.method} ${req.path}:`, error);
    return res.status(500).json({
      error: 'Security middleware failed',
      code: 'SECURITY_MIDDLEWARE_ERROR'
    });
  }
}

/**
 * 📋 SECURITY STATUS CHECKER
 * Validates security configuration
 */
export function checkSecurityConfig(): {
  isSecure: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Check admin API key
  const adminApiKey = process.env.ADMIN_API_KEY || process.env.SESSION_SECRET;
  if (!adminApiKey) {
    warnings.push('No ADMIN_API_KEY configured - using SESSION_SECRET fallback');
  }
  
  if (adminApiKey && adminApiKey.length < 32) {
    warnings.push('Admin API key is too short - should be at least 32 characters');
  }
  
  // Check environment
  if (process.env.NODE_ENV === 'development') {
    if (process.env.DISABLE_ADMIN_AUTH === 'true') {
      warnings.push('Admin authentication is DISABLED in development mode');
      recommendations.push('Enable admin auth for production deployment');
    }
  }
  
  // Check HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    recommendations.push('Ensure HTTPS is enabled for all admin endpoints');
    recommendations.push('Consider IP whitelisting for admin access');
    recommendations.push('Enable request logging and monitoring');
  }
  
  return {
    isSecure: warnings.length === 0,
    warnings,
    recommendations
  };
}

export default {
  requireAdminAuth,
  rateLimit,
  auditLog,
  protectAdminEndpoint,
  checkSecurityConfig
};