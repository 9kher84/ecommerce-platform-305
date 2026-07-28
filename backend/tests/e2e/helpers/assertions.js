const { Award, EventLog, OutboxEvent, CommercialProcess, PurchaseRequest, sequelize } = require('../../../sequelize_setup');

async function assertAwardCreated(processId) {
  const process = await CommercialProcess.findByPk(processId, { include: ['workPackage'] });
  if (!process) throw new Error(`Process ${processId} not found`);
  
  const award = await Award.findOne({ where: { purchaseRequestId: process.workPackage.purchaseRequestId } });
  if (!award) throw new Error(`Award for process ${processId} not created`);
  return award;
}

async function assertNoDuplicateAwards(processId) {
  const process = await CommercialProcess.findByPk(processId);
  const awards = await Award.findAll({ where: { purchaseRequestId: process.workPackageId } });
  if (awards.length > 1) {
    throw new Error(`Duplicate awards found for process ${processId}. Count: ${awards.length}`);
  }
}

async function assertEventLogCreated(entityId, eventType) {
  const log = await EventLog.findOne({ where: { entityId, actionType: eventType } });
  if (!log) throw new Error(`EventLog for ${entityId} with type ${eventType} not found`);
  return log;
}

async function assertOutboxEventCreated(aggregateId, eventType) {
  const outbox = await OutboxEvent.findOne({ where: { aggregateId, eventType } });
  if (!outbox) throw new Error(`OutboxEvent for ${aggregateId} with type ${eventType} not found`);
  return outbox;
}

module.exports = {
  assertAwardCreated,
  assertNoDuplicateAwards,
  assertEventLogCreated,
  assertOutboxEventCreated
};
