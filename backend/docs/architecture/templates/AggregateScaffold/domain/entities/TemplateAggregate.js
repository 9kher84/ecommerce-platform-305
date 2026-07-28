const AggregateRoot = require('../../../../../../src/shared/domain/AggregateRoot');
const DomainViolationException = require('../../../../../../src/shared/domain/DomainViolationException');
const TemplateCreatedEvent = require('../events/TemplateCreatedEvent');

class TemplateAggregate extends AggregateRoot {
  constructor(data) {
    super(data.id, data.version || 1);
    this.status = data.status || "draft";
    // Define properties here
  }

  static VALID_TRANSITIONS = {
    draft: ["active"],
    active: ["closed"]
  };

  canTransition(newStatus) {
    const allowed = TemplateAggregate.VALID_TRANSITIONS[this.status];
    return allowed && allowed.includes(newStatus);
  }

  create() {
    if (!this.canTransition("active")) {
      throw new DomainViolationException(`Cannot activate from '${this.status}' state.`, "INVALID_TRANSITION");
    }

    this.status = "active";
    this.incrementVersion();
    this.addEvent(new TemplateCreatedEvent({ aggregate: this }));
  }
}

module.exports = TemplateAggregate;
