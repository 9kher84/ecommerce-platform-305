class ValidationResult {
  constructor() {
    this.isValid = true;
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
    this.metadata = {};
  }

  addError(message) {
    this.isValid = false;
    this.errors.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  addSuggestion(message) {
    this.suggestions.push(message);
  }
  
  merge(otherResult) {
    if (!otherResult.isValid) this.isValid = false;
    this.errors.push(...otherResult.errors);
    this.warnings.push(...otherResult.warnings);
    this.suggestions.push(...otherResult.suggestions);
    this.metadata = { ...this.metadata, ...otherResult.metadata };
  }
}

module.exports = ValidationResult;
