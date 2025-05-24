export const loadTestConfig = {
  // Test scenarios
  scenarios: {
    basic: {
      duration: 30,
      rate: 50,
      connections: 100
    },
    stress: {
      duration: 60,
      rate: 200,
      connections: 500
    },
    spike: {
      duration: 120,
      phases: [
        { duration: 30, rate: 50 },
        { duration: 30, rate: 500 },
        { duration: 30, rate: 50 },
        { duration: 30, rate: 0 }
      ]
    }
  },

  // Endpoints to test
  endpoints: [
    {
      name: 'Health Check',
      method: 'GET',
      path: '/health',
      weight: 1
    },
    {
      name: 'Profile List',
      method: 'GET',
      path: '/api/profiles',
      weight: 5
    },
    {
      name: 'Profile Detail',
      method: 'GET',
      path: '/api/profiles/:id',
      weight: 3
    },
    {
      name: 'Authentication',
      method: 'POST',
      path: '/api/auth/login',
      weight: 2,
      payload: {
        email: 'test@example.com',
        password: 'password123'
      }
    }
  ],

  // Success criteria
  thresholds: {
    http: {
      latency: {
        p95: 500,    // 95th percentile should be under 500ms
        p99: 1000,   // 99th percentile should be under 1000ms
        max: 2000    // No request should take longer than 2000ms
      },
      errorRate: 0.01  // Error rate should be under 1%
    },
    cpu: 80,          // CPU usage should stay under 80%
    memory: 85        // Memory usage should stay under 85%
  },

  // Rate limiting verification
  rateLimits: {
    anonymous: 100,   // requests per 15 minutes for anonymous users
    authenticated: 1000, // requests per 15 minutes for authenticated users
    backoff: {
      initialDelay: 1000,
      maxDelay: 60000,
      factor: 2
    }
  }
};