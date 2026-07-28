const EventBus = require('../../../../../../src/shared/infrastructure/eventBus/EventBus');

class CreateTemplateUseCase {
  constructor({ templateRepo, transactionManager }) {
    this.templateRepo = templateRepo;
    this.transactionManager = transactionManager;
  }

  async execute(command) {
    // 1. Load or Initialize Aggregate
    // const aggregate = new TemplateAggregate({});

    // 2. Validate Ownership/Permission (if any)
    
    // 3. Domain Logic
    // aggregate.create();

    // 4. Persistence with Transaction Boundary & Optimistic Lock
    // await this.transactionManager.execute(async (t) => {
    //   await this.templateRepo.store(aggregate, aggregate.version, t); 
    // });

    // 5. Dispatch Domain Events (Post-Commit)
    // aggregate.pullEvents().forEach(event => {
    //   EventBus.publish(event);
    // });

    // return aggregate;
  }
}

module.exports = CreateTemplateUseCase;
