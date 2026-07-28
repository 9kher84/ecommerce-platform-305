const AppError = require('../../../utils/appError');

class ConcurrencyException extends AppError {
  /**
   * @param {string} aggregateName 
   * @param {string} aggregateId 
   * @param {number} expectedVersion 
   * @param {number} actualVersion 
   */
  constructor(aggregateName, aggregateId, expectedVersion, actualVersion = null) {
    super(`Concurrency conflict detected on ${aggregateName} with id ${aggregateId}. Expected version: ${expectedVersion}, Actual version: ${actualVersion || 'Unknown'}.`, 409);
    this.name = 'ConcurrencyException';
    this.aggregateName = aggregateName;
    this.aggregateId = aggregateId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

module.exports = ConcurrencyException;
