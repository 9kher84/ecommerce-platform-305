const AppError = require('../../../../../utils/appError');
const PurchaseRequest = require('../../domain/entities/PurchaseRequest');

/**
 * APPLICATION SERVICE (Use Case): Create Purchase Request
 * Orchestrates the creation of a draft purchase request via Domain and persists it atomically.
 */
class CreatePurchaseRequestUseCase {
  /**
   * @param {Object} deps
   * @param {import('../ports/PurchaseRequestRepositoryPort')} deps.requestRepo
   * @param {import('../../../../shared/application/UnitOfWork')} deps.unitOfWork
   */
  constructor({ requestRepo, unitOfWork }) {
    this.requestRepo = requestRepo;
    this.unitOfWork = unitOfWork;
  }

  /**
   * Executes the use case.
   * @param {Object} dto 
   * @param {Object} dto.header
   * @param {Array} dto.items
   * @param {Array} dto.invitations
   * @param {string} dto.actorId
   * @param {string} dto.actorRole
   */
  async execute(dto) {
    const { header, items, invitations, actorId, actorRole } = dto;

    const authContext = { actorId, actorRole };

    // 1. Instantiate Aggregate using Domain Factory
    // This runs domain rules and registers RequestCreatedEvent
    const request = PurchaseRequest.create(header, items, invitations, authContext);

    // 2. Persist Aggregate + Events using Unit of Work
    await this.unitOfWork.commit(request, async (t) => {
      // expectedVersion 0 or null forces an insert
      await this.requestRepo.store(request, 0, t);
    });

    return request;
  }
}

module.exports = CreatePurchaseRequestUseCase;
