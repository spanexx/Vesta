export const securityHeaders = (req, res, next) => {
  // Content Security Policy header
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // Removed bybit related sources and injections for script sources.
      // Previously: "script-src 'self' 'unsafe-eval' https://*.bybit.com blob:",
      "script-src 'self' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' blob: data:",
      "media-src 'self' blob:",
      // Removed worker, child, and frame directives that referenced bybit.
      // "connect-src 'self' https://api.stripe.com https://api.binance.com".replace(/https:\/\/\*\.bybit\.com\s*/, ''), 
      // Removed script-src-elem that referenced bybit.
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
