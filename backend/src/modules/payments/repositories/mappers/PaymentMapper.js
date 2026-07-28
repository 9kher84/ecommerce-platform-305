const Payment = require('../../domain/entities/Payment');

class PaymentMapper {
  static toDomain(sequelizeModel) {
    if (!sequelizeModel) return null;
    return new Payment({
      id: sequelizeModel.id,
      escrowId: sequelizeModel.escrowId,
      awardId: sequelizeModel.awardId,
      amount: sequelizeModel.amount,
      currency: sequelizeModel.currency,
      provider: sequelizeModel.provider,
      providerReference: sequelizeModel.providerReference,
      status: sequelizeModel.status,
      version: sequelizeModel.version
    });
  }

  static toPersistence(aggregate) {
    return {
      id: aggregate.id,
      escrowId: aggregate.escrowId,
      awardId: aggregate.awardId,
      amount: aggregate.amount,
      currency: aggregate.currency,
      provider: aggregate.provider,
      providerReference: aggregate.providerReference,
      status: aggregate.status,
      failureReason: aggregate.failureReason || null,
      version: aggregate.version
    };
  }
}

module.exports = PaymentMapper;
