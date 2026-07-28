
const { v4: uuidv4 } = require('uuid');
const { User, Role, Organization, OrganizationUser, sequelize } = require('../../../sequelize_setup');
const { generateTestToken } = require('./auth');

const baseURL = process.env.BASE_URL || 'http://localhost:5000';

async function createIsolatedUser(role, emailPrefix) {
  const email = `${emailPrefix}_${uuidv4().substring(0, 8)}@test.com`;
  const transaction = await sequelize.transaction();
  try {
    const org = await Organization.create({
      name: `${role} Org`,
      industry: 'Construction',
      verified: true
    }, { transaction });

    const user = await User.create({
      name: `smoke_${role}`,
      email: email,
      password: 'dummy_hash',
      isVerified: true
    }, { transaction });

    await OrganizationUser.create({
      user_id: user.id,
      organization_id: org.id,
      role: 'admin',
      is_primary: true
    }, { transaction });

    const roleRecord = await Role.findOne({ where: { name: role }, transaction });
    if (roleRecord) {
      await user.addRole(roleRecord, { transaction });
    }

    await transaction.commit();
    return { user, org, token: generateTestToken(user.id, role) };
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}

async function createRequest(buyerToken) {
  const res = await fetch(`${baseURL}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${buyerToken}` },
    body: JSON.stringify({
      header: {
        title: "Smoke Test Project",
        description: "Automated test"
      },
      items: [{ lineNumber: 1, title: "Steel Works", description: "Steel", category: "Steel", quantity: 10, unit: "TON" }]
    })
  });
  if (!res.ok) throw new Error(`Create request failed: ${await res.text()}`);
  return await res.json();
}

async function publishRequest(buyerToken, requestId) {
  const res = await fetch(`${baseURL}/api/requests/${requestId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${buyerToken}` }
  });
  if (!res.ok) throw new Error(`Publish failed: ${await res.text()}`);
  return await res.json();
}

async function submitProposal(sellerToken, workPackageId, amount) {
  const res = await fetch(`${baseURL}/api/v2/negotiations/work-packages/${workPackageId}/proposals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sellerToken}` },
    body: JSON.stringify({
      terms: { amount },
      notes: "Test proposal"
    })
  });
  if (!res.ok) throw new Error(`Proposal failed: ${await res.text()}`);
  return await res.json();
}

async function acceptProposal(buyerToken, processId) {
  const res = await fetch(`${baseURL}/api/v2/negotiations/${processId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${buyerToken}` }
  });
  if (!res.ok) throw new Error(`Accept failed: ${await res.text()}`);
  return await res.json();
}

async function checkoutAwards(buyerToken, processIds) {
  const res = await fetch(`${baseURL}/api/v2/negotiations/awards/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${buyerToken}` },
    body: JSON.stringify({ processIds })
  });
  if (!res.ok) throw new Error(`Checkout failed: ${await res.text()}`);
  return await res.json();
}

module.exports = {
  createIsolatedUser,
  createRequest,
  publishRequest,
  submitProposal,
  acceptProposal,
  checkoutAwards
};
