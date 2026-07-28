const DomainEvent = require('../../../../shared/domain/DomainEvent');

class RequestCreatedEvent extends DomainEvent {
  constructor({ aggregate, authContext }) {
    super({
      aggregateType: 'PurchaseRequest',
      aggregateId: aggregate.id,
      eventType: 'RequestCreatedEvent',
      payload: {
        status: aggregate.status,
        sectorId: aggregate.sectorId,
        itemsCount: aggregate.items ? aggregate.items.length : 0,
        userId: aggregate.userId,
      },
      authContext
    });
  }
}

module.exports = RequestCreatedEvent;
