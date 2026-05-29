const { exec } = require("child_process");

console.log("🛡️  Running Dependency Zombie Audit...");

exec("npm audit --json", (error, stdout, stderr) => {
  try {
    const audit = JSON.parse(stdout);
    const vulns = audit.metadata.vulnerabilities;
    const totalHighCritical = vulns.high + vulns.critical;

    console.log("📊 Audit Results:");
    console.log(`   - Critical: ${vulns.critical}`);
    console.log(`   - High: ${vulns.high}`);
    console.log(`   - Moderate: ${vulns.moderate}`);
    console.log(`   - Low: ${vulns.low}`);

    if (totalHighCritical > 0) {
      console.error(
        "\n❌ ZOMBIE DETECTED: Critical/High vulnerabilities found!",
      );
      console.error(
        '   Access DENIED. Fix vulnerabilities using "npm audit fix" before deploying.',
      );
      process.exit(1);
    } else {
      console.log("\n✅ System Clean. No high-level zombies detected.");
      process.exit(0);
    }
  } catch (e) {
    // If npm audit failed to output JSON or other partial error (often code 1 means vulns found)
    // We need to be careful. If stdout has JSON, parses it.
    // Usually npm audit returns exit code 1 if vulns found.
    if (stdout) {
      const audit = JSON.parse(stdout);
      const vulns = audit.metadata.vulnerabilities;
      if (vulns.high + vulns.critical > 0) {
        console.error(
          "\n❌ ZOMBIE DETECTED: Critical/High vulnerabilities found!",
        );
        process.exit(1);
      }
      process.exit(0);
    }
    console.error(
      "⚠️  Audit execution failed:",
      error ? error.message : "Unknown",
    );
    process.exit(1);
  }
});
