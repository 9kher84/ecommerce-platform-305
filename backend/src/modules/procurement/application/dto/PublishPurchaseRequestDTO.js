/**
 * DTO: Data Transfer Object for Publishing a Purchase Request.
 * Represents the exact payload the Application Service expects from the Controller.
 */
class PublishPurchaseRequestDTO {
  constructor({ requestId, publishAsRFQ, actorId, actorRole, ipAddress, userAgent }) {
    this.requestId = requestId;
    this.publishAsRFQ = publishAsRFQ;
    // Auth Context
    this.actorId = actorId;
    this.actorRole = actorRole;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
  }
}

module.exports = PublishPurchaseRequestDTO;
