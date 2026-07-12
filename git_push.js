const { execSync } = require('child_process');

try {
  console.log("Adding file...");
  execSync('git add backend/middleware/aiOutputSanitizer.js', { stdio: 'inherit' });
  
  console.log("Committing...");
  execSync('git commit -m "fix: remove generic heuristic regex"', { stdio: 'inherit' });
  
  console.log("Pushing...");
  execSync('git push origin-305 master', { stdio: 'inherit' });
  
  console.log("Done!");
} catch (e) {
  console.error("Error:", e.message);
}
