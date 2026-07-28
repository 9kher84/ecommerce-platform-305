const DomainEvent = require('../../../../shared/domain/DomainEvent');

class RequestPublishedEvent extends DomainEvent {
  constructor({ aggregate, authContext }) {
    super('RequestPublishedEvent', aggregate.id, {
      userId: aggregate.userId,
      sectorId: aggregate.sectorId,
      status: aggregate.status,
      rfqStatus: aggregate.rfqStatus,
      title: aggregate.title,
      description: aggregate.description,
      authContext
    }, 1, aggregate.version);
    
    this.aggregate = aggregate;
    this.authContext = authContext;
  }
}

module.exports = RequestPublishedEvent;
