const TemplateAggregate = require('../../../domain/entities/TemplateAggregate');

class TemplateMapper {
  static toDomain(sequelizeModel) {
    if (!sequelizeModel) return null;

    return new TemplateAggregate({
      id: sequelizeModel.id,
      version: sequelizeModel.version,
      status: sequelizeModel.status
    });
  }

  static toPersistence(aggregate) {
    const data = {
      status: aggregate.status,
      version: aggregate.version
    };

    if (aggregate.id) {
      data.id = aggregate.id;
    }

    return data;
  }
}

module.exports = TemplateMapper;
