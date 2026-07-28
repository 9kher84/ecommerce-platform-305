const AppError = require('../../../utils/appError');

class DomainException extends AppError {
  constructor(message, code) {
    super(message, 400); // Bad Request mapping at HTTP layer
    this.name = this.constructor.name;
    this.code = code || 'DOMAIN_VIOLATION';
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = DomainException;
