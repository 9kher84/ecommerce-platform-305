class DomainViolationException extends Error {
  constructor(message, violationType = "ILLEGAL_STATE_TRANSITION") {
    super(message);
    this.name = "DomainViolationException";
    this.violationType = violationType;
  }
}

module.exports = DomainViolationException;
