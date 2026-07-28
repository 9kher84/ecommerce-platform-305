const DomainEvent = require('../../../../../../src/shared/domain/DomainEvent');

class TemplateCreatedEvent extends DomainEvent {
  constructor({ aggregate }) {
    super('TemplateCreatedEvent', aggregate.id, {
      status: aggregate.status
      // ... other payload fields
    }, 1, aggregate.version);
    
    this.aggregate = aggregate;
  }
}

module.exports = TemplateCreatedEvent;
