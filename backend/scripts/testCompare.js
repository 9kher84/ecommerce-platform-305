let b;
try {
  b = require('bcryptjs');
} catch(e) {
  b = require('bcrypt');
}

const hash = '$2b$10$OBEJCvcd129h7yCWvhUod.WfKxLN8uY/5kWbkn/v4fsQObCb0xNve';
b.compare('Test@12345', hash).then(r => console.log('Test@12345:', r));
b.compare('@testdata.com', hash).then(r => console.log('@testdata.com:', r));
b.compare('test123', hash).then(r => console.log('test123:', r));
b.compare('password', hash).then(r => console.log('password:', r));
