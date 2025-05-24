export const securityHeaders = (req, res, next) => {
  // Content Security Policy header
  const isDevelopment = process.env.NODE_ENV === 'development';
  const frontendUrl = process.env.FRONTEND_URL || 'https://vesta.spanexx.com';
  
  // Allow CORS headers for the current request
  const origin = req.headers.origin;
  const allowedOrigins = ['https://vesta.spanexx.com', 'http://localhost:4200'];
  
  if (origin && (allowedOrigins.includes(origin) || process.env.CORS_ORIGINS?.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.setHeader(
    'Content-Security-Policy',
    [
      `default-src 'self' ${frontendUrl} http://localhost:4200`,
      // Removed bybit related sources and injections for script sources.
      "script-src 'self' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' blob: data:",
      "media-src 'self' blob:",      // Connect sources
      `connect-src 'self' ${frontendUrl} http://localhost:4200 https://api.stripe.com https://api.binance.com`,
      "webassembly-src 'self' 'unsafe-eval'"
    ].join('; ')
  );

  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};
