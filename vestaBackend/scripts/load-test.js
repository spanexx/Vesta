import autocannon from 'autocannon';
import { loadTestConfig } from '../config/loadtest.config.js';
import { config } from '../config/config.js';
import { getMetrics } from '../utils/monitoring.js';

const runScenario = async (name, scenario) => {
  console.log(`\nRunning ${name} scenario...`);
  
  const instance = autocannon({
    url: `http://localhost:${config.port}`,
    connections: scenario.connections || 100,
    duration: scenario.duration || 30,
    requests: loadTestConfig.endpoints.map(endpoint => ({
      method: endpoint.method,
      path: endpoint.path,
      body: endpoint.payload ? JSON.stringify(endpoint.payload) : undefined,
      headers: {
        'Content-Type': 'application/json'
      }
    })),
    timeout: 10,
    connectionRate: scenario.rate,
    amount: scenario.amount,
    phases: scenario.phases
  });

  autocannon.track(instance);

  return new Promise((resolve) => {
    instance.on('done', (results) => {
      // Get system metrics
      const metrics = getMetrics();
      
      // Analyze results
      const analysis = {
        timestamp: new Date().toISOString(),
        scenario: name,
        throughput: {
          average: results.requests.average,
          mean: results.requests.mean,
          stddev: results.requests.stddev,
          min: results.requests.min,
          max: results.requests.max
        },
        latency: {
          average: results.latency.average,
          p95: results.latency.p95,
          p99: results.latency.p99,
          max: results.latency.max
        },
        errors: results.errors,
        timeouts: results.timeouts,
        duration: results.duration,
        systemMetrics: metrics
      };

      // Validate against thresholds
      const thresholdViolations = [];
      
      if (analysis.latency.p95 > loadTestConfig.thresholds.http.latency.p95) {
        thresholdViolations.push(`P95 latency ${analysis.latency.p95}ms exceeds threshold ${loadTestConfig.thresholds.http.latency.p95}ms`);
      }
      
      if (analysis.latency.p99 > loadTestConfig.thresholds.http.latency.p99) {
        thresholdViolations.push(`P99 latency ${analysis.latency.p99}ms exceeds threshold ${loadTestConfig.thresholds.http.latency.p99}ms`);
      }
      
      if (metrics.cpu > loadTestConfig.thresholds.cpu) {
        thresholdViolations.push(`CPU usage ${metrics.cpu}% exceeds threshold ${loadTestConfig.thresholds.cpu}%`);
      }
      
      if (metrics.memory > loadTestConfig.thresholds.memory) {
        thresholdViolations.push(`Memory usage ${metrics.memory}MB exceeds threshold ${loadTestConfig.thresholds.memory}MB`);
      }

      // Print results
      console.log('\nResults:', JSON.stringify(analysis, null, 2));
      
      if (thresholdViolations.length > 0) {
        console.error('\nThreshold Violations:');
        thresholdViolations.forEach(violation => console.error(`❌ ${violation}`));
      } else {
        console.log('\n✅ All thresholds passed');
      }

      resolve(analysis);
    });
  });
};

const runLoadTest = async () => {
  try {
    console.log('Starting load tests...');
    
    // Run basic scenario first
    await runScenario('basic', loadTestConfig.scenarios.basic);
    
    // Short pause between scenarios
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run stress test
    await runScenario('stress', loadTestConfig.scenarios.stress);
    
    // Another pause before spike test
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run spike test
    await runScenario('spike', loadTestConfig.scenarios.spike);
    
    console.log('\nLoad testing completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Load test failed:', error);
    process.exit(1);
  }
};

// Run the tests
runLoadTest();