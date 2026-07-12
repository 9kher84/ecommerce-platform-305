require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fetch = global.fetch;
if (!fetch) {
  console.error('Fetch API not available in this Node version.');
  process.exit(1);
}

const apiKey = process.env.RENDER_API_KEY;
if (!apiKey) {
  console.error('RENDER_API_KEY not set in environment');
  process.exit(1);
}

async function getServices() {
  const resp = await fetch('https://api.render.com/v1/services', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch services: ${resp.status} ${await resp.text()}`);
  }
  return resp.json();
}

async function getLogs(ownerId, resource) {
  const url = `https://render.com?ownerId=${ownerId}&resource=${resource}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch logs: ${resp.status} ${await resp.text()}`);
  }
  return resp.text();
}


(async () => {
  try {
    const services = await getServices();
    if (!Array.isArray(services) || services.length === 0) {
      console.log('No services found');
      return;
    }
    console.log('Available services:');
    services.forEach((svc, idx) => {
      console.log(`${idx + 1}. ID: ${svc.id || svc.serviceId || svc._id || svc.service_id}, Name: ${svc.name || svc.serviceName || 'N/A'}`);
    });
// Use OWNER_ID from .env and known resource ID for log retrieval
const ownerId = process.env.OWNER_ID;
const resource = 'srv-d8e2mqs2m8qs738h8n00';
if (!ownerId) {
  console.error('OWNER_ID not set in environment');
  return;
}
console.log('Fetching logs with ownerId and resource');
const logs = await getLogs(ownerId, resource);
    console.log('--- Logs start ---');
    console.log(logs);
    console.log('--- Logs end ---');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
