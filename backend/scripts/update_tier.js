const { Sequelize } = require('sequelize');
const s = new Sequelize('postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require', { logging: false });
s.query("SELECT * FROM \"Users\" WHERE id='afd0aa5d-4930-4412-8ae8-9eb5b46a24e9'")
  .then(r => console.log(r[0]))
  .catch(console.error)
  .finally(()=>s.close());
