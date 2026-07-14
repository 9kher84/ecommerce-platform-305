class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class DuplicateSellerListingError extends DomainError {
  constructor(message = "Organization already has an active listing for this product") {
    super(message);
  }
}

class ListingNotFoundError extends DomainError {
  constructor(message = "Seller listing not found or archived") {
    super(message);
  }
}

class ListingOwnershipError extends DomainError {
  constructor(message = "You do not have permission to modify this listing") {
    super(message);
  }
}

class InvalidListingDataError extends DomainError {
  constructor(message = "Invalid listing data provided") {
    super(message);
  }
}

module.exports = {
  DomainError,
  DuplicateSellerListingError,
  ListingNotFoundError,
  ListingOwnershipError,
  InvalidListingDataError
};
