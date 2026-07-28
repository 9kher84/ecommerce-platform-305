class AggregateRoot {
  constructor(id, version = 1) {
    this.id = id;
    this.version = version;
    this._domainEvents = [];
  }

  /**
   * Protected method to record a new domain event.
   * Only the aggregate itself should call this method.
   * @param {import('./DomainEvent')} event 
   */
  addEvent(event) {
    event.aggregateType = this.constructor.name;
    this._domainEvents.push(event);
  }

  /**
   * Pulls and clears all uncommitted domain events.
   * Expected to be called by the Application Layer (Use Cases) post-commit.
   * @returns {Array<import('./DomainEvent')>}
   */
  pullEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Explicitly increments the aggregate's version. 
   * Should be called in any mutating domain method.
   */
  incrementVersion() {
    this.version += 1;
  }
}

module.exports = AggregateRoot;
