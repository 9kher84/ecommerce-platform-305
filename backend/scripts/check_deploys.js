require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const apiKey = process.env.RENDER_API_KEY;

async function checkDeploys() {
  const resp = await fetch('https://api.render.com/v1/services/srv-d8e2mqs2m8qs738h8n00/deploys?limit=5', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await resp.json();
  console.log(JSON.stringify(data.map(d => ({
    id: d.deploy.id,
    commit: d.deploy.commit.id,
    message: d.deploy.commit.message,
    status: d.deploy.status,
    createdAt: d.deploy.createdAt,
    finishedAt: d.deploy.finishedAt
  })), null, 2));
}

checkDeploys();
