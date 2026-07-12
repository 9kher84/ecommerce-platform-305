require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const apiKey = process.env.RENDER_API_KEY;

async function triggerDeploy() {
  const resp = await fetch('https://api.render.com/v1/services/srv-d8e2mqs2m8qs738h8n00/deploys', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ clearCache: "clear" })
  });
  const data = await resp.json();
  console.log(data);
}

triggerDeploy();
