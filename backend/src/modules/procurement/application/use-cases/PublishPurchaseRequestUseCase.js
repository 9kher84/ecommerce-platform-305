const AppError = require('../../../../../utils/appError');
const AuditHelper = require('../../../../../utils/AuditHelper');
const DomainViolationException = require('../../domain/exceptions/DomainViolationException');
const { appendEventLog } = require('../../../../../services/eventLogService');
const RequestPublishedEvent = require('../../domain/events/RequestPublishedEvent');
const EventBus = require('../../../../shared/infrastructure/eventBus/EventBus');
const { sequelize } = require('../../../../../sequelize_setup');

/**
 * APPLICATION SERVICE (Use Case): Publish Purchase Request
 * Orchestrates the domain logic, repository persistence, and event emission.
 */
class PublishPurchaseRequestUseCase {
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
   * @param {import('../dto/PublishPurchaseRequestDTO')} dto 
   */
  async execute(dto) {
    const { requestId, publishAsRFQ, actorId, actorRole, ipAddress, userAgent } = dto;
    const targetStatus = publishAsRFQ ? "rfq_published" : "published";

    // 1. Fetch Aggregate
    const request = await this.requestRepo.findById(requestId);
    if (!request) {
      throw new AppError("Request not found", 404);
    }

    // 2. Auth Context for Domain Service
    const authContext = { actorId, actorRole, ipAddress, userAgent };

    // 3. Domain Logic: State Machine validation and Aggregate Mutation
    let previousStatus, newStatus;
    const expectedVersion = request.version;

    try {
      const result = request.publish(publishAsRFQ, authContext);
      previousStatus = result.previousStatus;
      newStatus = result.newStatus;
    } catch (error) {
      if (error instanceof DomainViolationException) {
        if (error.violationType === "MALICIOUS_ACTOR_SUSPENSION_REQUIRED") {
          // Suspension Policy (Application Layer side-effect based on Domain rule)
          const { User, ActionLog } = require('../../../../../sequelize_setup');
          await User.update({ isActive: false, is_restricted: true }, { where: { id: actorId } });
          await ActionLog.create({
            adminId: "SYSTEM_AUTOPILOT",
            targetId: actorId,
            fieldName: "ACCOUNT_STATUS",
            oldValue: "active",
            newValue: "suspended_due_to_logic_violation",
            ipAddress: ipAddress || "0.0.0.0",
            timestamp: new Date(),
          });
          throw new AppError("CRITICAL LOGIC VIOLATION: Your account has been suspended for attempting an illegal state transition.", 403);
        }
        throw new AppError(error.message, 400);
      }
      throw error;
    }

    console.log(`[PublishPurchaseRequestUseCase] Events before commit: ${request._domainEvents.length}`);
    let publishedEvents = [];

    await this.unitOfWork.commit(request, async (t) => {
      await this.requestRepo.store(request, expectedVersion, t);
      if (typeof request.getEvents === 'function') {
        publishedEvents = request.getEvents();
      } else if (Array.isArray(request._domainEvents)) {
        publishedEvents = [...request._domainEvents];
      }

      // 5. Side Effects (Legacy Audit Logs)
      await appendEventLog({
        actorId: actorId || request.userId,
        actorRole: actorRole || "system",
        entityType: "request",
        entityId: request.id,
        actionType: "status_transition",
        beforeState: { status: previousStatus },
        afterState: { status: newStatus },
        ipAddress: ipAddress || "127.0.0.1",
        userAgent: userAgent || "Internal/Service",
      }, { transaction: t });

      const mockReq = {
        auth: { principal: { id: actorId }, actor: { id: actorId } },
        user: { id: actorId },
        ip: ipAddress || "127.0.0.1",
        headers: { "user-agent": userAgent || "Internal/Service" },
        connection: { remoteAddress: ipAddress || "127.0.0.1" },
      };

      await AuditHelper.log(
        mockReq,
        `REQUEST_STATUS_${newStatus.toUpperCase()}`,
        { type: "PurchaseRequest", id: request.id },
        {},
        { previousStatus, newStatus, reason: null },
        { transaction: t }
      );
    });

    // 6. Dispatch events to in-memory listeners post-commit
    for (const event of publishedEvents) {
      try {
        EventBus.publish(event);
      } catch (err) {
        console.error(`[PublishPurchaseRequestUseCase] EventBus publish error for ${event?.name}:`, err);
      }
    }

    return request;
  }
}

module.exports = PublishPurchaseRequestUseCase;
