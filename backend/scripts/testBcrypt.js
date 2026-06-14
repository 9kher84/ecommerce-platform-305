const bcrypt = require('bcrypt'); // Falling back to bcrypt as it is used in the project, or I will try bcryptjs first. Wait, let's try bcryptjs first, if not found fallback to bcrypt.
let b;
try {
  b = require('bcryptjs');
} catch(e) {
  b = require('bcrypt');
}

async function test() {
  const hash = '$2b$10$nwOGTReXkh7SRZAeQae3O.f/VGHnRs.F74HeQGLIhf1.79bAUqa5m';
  const result = await b.compare('Test@12345', hash);
  console.log('bcrypt compare result:', result);
  
  const hash2 = await b.hash('Test@12345', 10);
  console.log('new hash:', hash2);
  const result2 = await b.compare('Test@12345', hash2);
  console.log('verify new hash:', result2);
}
test();
