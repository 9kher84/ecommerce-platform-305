#!/usr/bin/env node

/**
 * Load Testing Script for E-Commerce Platform
 *
 * This script performs load testing on various endpoints to establish
 * performance baselines and identify bottlenecks.
 *
 * Usage:
 *   node scripts/loadTest.js [endpoint]
 *
 * Examples:
 *   node scripts/loadTest.js health
 *   node scripts/loadTest.js all
 */

const autocannon = require("autocannon");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const DURATION = parseInt(process.env.DURATION) || 30; // seconds
const CONNECTIONS = parseInt(process.env.CONNECTIONS) || 100;

// Test configurations
const tests = {
  health: {
    url: `${BASE_URL}/api/health`,
    method: "GET",
    title: "Health Check Endpoint",
  },
  healthAdvanced: {
    url: `${BASE_URL}/api/health/advanced`,
    method: "GET",
    title: "Advanced Health Check Endpoint",
  },
  // Add more endpoints as needed
};

/**
 * Run load test for a specific endpoint
 */
async function runTest(testName, config) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔥 Load Testing: ${config.title}`);
  console.log(`URL: ${config.url}`);
  console.log(`Duration: ${DURATION}s | Connections: ${CONNECTIONS}`);
  console.log(`${"=".repeat(60)}\n`);

  const instance = autocannon({
    url: config.url,
    method: config.method || "GET",
    connections: CONNECTIONS,
    duration: DURATION,
    headers: config.headers || {},
    body: config.body ? JSON.stringify(config.body) : undefined,
  });

  autocannon.track(instance, { renderProgressBar: true });

  return new Promise((resolve, reject) => {
    instance.on("done", (result) => {
      printResults(result);
      resolve(result);
    });

    instance.on("error", reject);
  });
}

/**
 * Print formatted results
 */
function printResults(result) {
  console.log("\n📊 Results:");
  console.log(`${"─".repeat(60)}`);

  // Requests
  console.log("\n📈 Requests:");
  console.log(`  Total:     ${result.requests.total}`);
  console.log(`  Sent:      ${result.requests.sent}`);
  console.log(`  Average:   ${result.requests.average} req/sec`);
  console.log(`  Mean:      ${result.requests.mean} req/sec`);
  console.log(`  Stddev:    ${result.requests.stddev}`);
  console.log(`  Min:       ${result.requests.min} req/sec`);
  console.log(`  Max:       ${result.requests.max} req/sec`);

  // Latency
  console.log("\n⏱️  Latency:");
  console.log(`  Average:   ${result.latency.mean} ms`);
  console.log(`  Median:    ${result.latency.p50} ms`);
  console.log(`  p95:       ${result.latency.p95} ms`);
  console.log(`  p99:       ${result.latency.p99} ms`);
  console.log(`  p99.9:     ${result.latency.p999} ms`);
  console.log(`  Min:       ${result.latency.min} ms`);
  console.log(`  Max:       ${result.latency.max} ms`);

  // Throughput
  console.log("\n📦 Throughput:");
  console.log(
    `  Average:   ${(result.throughput.mean / 1024 / 1024).toFixed(2)} MB/sec`,
  );
  console.log(
    `  Total:     ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB`,
  );

  // Errors
  console.log("\n❌ Errors:");
  console.log(`  Total:     ${result.errors}`);
  console.log(`  Timeouts:  ${result.timeouts}`);
  console.log(`  Non-2xx:   ${result.non2xx}`);

  // Status codes
  if (Object.keys(result["2xx"] || {}).length > 0) {
    console.log("\n✅ Status Codes (2xx):");
    Object.entries(result["2xx"]).forEach(([code, count]) => {
      console.log(`  ${code}: ${count}`);
    });
  }

  if (Object.keys(result["4xx"] || {}).length > 0) {
    console.log("\n⚠️  Status Codes (4xx):");
    Object.entries(result["4xx"]).forEach(([code, count]) => {
      console.log(`  ${code}: ${count}`);
    });
  }

  if (Object.keys(result["5xx"] || {}).length > 0) {
    console.log("\n🔴 Status Codes (5xx):");
    Object.entries(result["5xx"]).forEach(([code, count]) => {
      console.log(`  ${code}: ${count}`);
    });
  }

  console.log(`\n${"─".repeat(60)}`);

  // Performance assessment
  assessPerformance(result);
}

/**
 * Assess performance and provide recommendations
 */
function assessPerformance(result) {
  console.log("\n🎯 Performance Assessment:");
  console.log(`${"─".repeat(60)}`);

  const p95 = result.latency.p95;
  const errorRate =
    ((result.errors + result.non2xx) / result.requests.total) * 100;
  const throughput = result.requests.average;

  // Latency assessment
  if (p95 < 100) {
    console.log("  ✅ Latency (p95): EXCELLENT (<100ms)");
  } else if (p95 < 200) {
    console.log("  ✅ Latency (p95): GOOD (<200ms)");
  } else if (p95 < 500) {
    console.log("  ⚠️  Latency (p95): ACCEPTABLE (<500ms)");
  } else {
    console.log("  ❌ Latency (p95): NEEDS IMPROVEMENT (>500ms)");
  }

  // Error rate assessment
  if (errorRate < 0.1) {
    console.log("  ✅ Error Rate: EXCELLENT (<0.1%)");
  } else if (errorRate < 1) {
    console.log("  ⚠️  Error Rate: ACCEPTABLE (<1%)");
  } else {
    console.log("  ❌ Error Rate: NEEDS IMPROVEMENT (>1%)");
  }

  // Throughput assessment
  if (throughput > 1000) {
    console.log("  ✅ Throughput: EXCELLENT (>1000 req/sec)");
  } else if (throughput > 500) {
    console.log("  ✅ Throughput: GOOD (>500 req/sec)");
  } else if (throughput > 100) {
    console.log("  ⚠️  Throughput: ACCEPTABLE (>100 req/sec)");
  } else {
    console.log("  ❌ Throughput: NEEDS IMPROVEMENT (<100 req/sec)");
  }

  console.log(`${"─".repeat(60)}\n`);
}

/**
 * Save results to file
 */
function saveResults(testName, result) {
  const resultsDir = path.join(__dirname, "../performance-results");
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const filename = `${testName}_${timestamp}.json`;
  const filepath = path.join(resultsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
  console.log(`💾 Results saved to: ${filepath}\n`);
}

/**
 * Main execution
 */
async function main() {
  const testName = process.argv[2] || "health";

  console.log("\n🚀 E-Commerce Platform - Load Testing");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test: ${testName}\n`);

  if (testName === "all") {
    // Run all tests
    const results = {};
    for (const [name, config] of Object.entries(tests)) {
      const result = await runTest(name, config);
      results[name] = result;
      saveResults(name, result);

      // Wait between tests
      if (name !== Object.keys(tests)[Object.keys(tests).length - 1]) {
        console.log("\n⏳ Waiting 5 seconds before next test...\n");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // Summary
    console.log("\n📋 Summary of All Tests:");
    console.log(`${"=".repeat(60)}`);
    Object.entries(results).forEach(([name, result]) => {
      console.log(`\n${tests[name].title}:`);
      console.log(`  Avg Latency: ${result.latency.mean.toFixed(2)} ms`);
      console.log(`  p95 Latency: ${result.latency.p95.toFixed(2)} ms`);
      console.log(
        `  Throughput:  ${result.requests.average.toFixed(2)} req/sec`,
      );
      console.log(
        `  Error Rate:  ${(((result.errors + result.non2xx) / result.requests.total) * 100).toFixed(2)}%`,
      );
    });
    console.log(`\n${"=".repeat(60)}\n`);
  } else {
    // Run single test
    if (!tests[testName]) {
      console.error(`❌ Unknown test: ${testName}`);
      console.log("\nAvailable tests:");
      Object.keys(tests).forEach((name) => {
        console.log(`  - ${name}: ${tests[name].title}`);
      });
      console.log("  - all: Run all tests");
      process.exit(1);
    }

    const result = await runTest(testName, tests[testName]);
    saveResults(testName, result);
  }

  console.log("✅ Load testing complete!\n");
}

// Run if called directly
if (require.main === module) {
  main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
}

module.exports = { runTest, tests };
