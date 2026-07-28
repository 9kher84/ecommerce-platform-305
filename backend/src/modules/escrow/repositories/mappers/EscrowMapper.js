const Escrow = require('../../domain/entities/Escrow');

class EscrowMapper {
  static toDomain(sequelizeModel) {
    if (!sequelizeModel) return null;
    return new Escrow({
      id: sequelizeModel.id,
      awardId: sequelizeModel.awardId,
      buyerId: sequelizeModel.buyerId,
      sellerId: sequelizeModel.sellerId,
      amount: sequelizeModel.amount,
      currency: sequelizeModel.currency,
      status: sequelizeModel.status,
      version: sequelizeModel.version
    });
  }

  static toPersistence(aggregate) {
    return {
      id: aggregate.id,
      awardId: aggregate.awardId,
      buyerId: aggregate.buyerId,
      sellerId: aggregate.sellerId,
      amount: aggregate.amount,
      currency: aggregate.currency,
      status: aggregate.status,
      version: aggregate.version
    };
  }
}

module.exports = EscrowMapper;
