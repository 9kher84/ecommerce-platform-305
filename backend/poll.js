const { execSync } = require('child_process');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function poll() {
  console.log("Polling Render until deployment is live...");
  for (let i = 0; i < 20; i++) {
    try {
      const output = execSync('node baseline_proof.js', { encoding: 'utf8' });
      if (output.includes("STOPPING:")) {
        console.log(`[Attempt ${i+1}] Still redacted... waiting 10s`);
        await sleep(10000);
      } else {
        console.log("\nDeployment is LIVE! Here is the final output:\n");
        console.log(output);
        return;
      }
    } catch (e) {
      console.log(`[Attempt ${i+1}] Script crashed... waiting 10s`);
      await sleep(10000);
    }
  }
}

poll();
