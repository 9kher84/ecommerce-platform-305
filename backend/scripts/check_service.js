require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const apiKey = process.env.RENDER_API_KEY;

async function checkService() {
  const resp = await fetch('https://api.render.com/v1/services/srv-d8e2mqs2m8qs738h8n00', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await resp.json();
  console.log(JSON.stringify(data, null, 2));
}

checkService();
