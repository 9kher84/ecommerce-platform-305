const authorizeV2 = require("../../middleware/authorizeV2");
const { 
  OrganizationMembership, 
  MembershipPermission, 
  Permission 
} = require("../../sequelize_setup");

describe("Authorization Middleware V2 (authorizeV2)", () => {
  const dummyUser = { id: "user-123" };
  const dummyOrgId = "org-456";
  const dummyMembership = { id: "membership-789", userId: "user-123", organizationId: "org-456", isOwner: false };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. Should return 401 if req.user is missing", async () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorizeV2("CREATE_RFQ")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("2. Should return 403 if no active membership exists for user", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue(null);

    const req = { user: dummyUser, headers: { "x-organization-id": dummyOrgId } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorizeV2("CREATE_RFQ")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("3. Should call next() when permission effect is ALLOW", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue(dummyMembership);
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "CREATE_RFQ" } }
    ]);

    const req = { user: dummyUser, headers: { "x-organization-id": dummyOrgId } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorizeV2("CREATE_RFQ")(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.membership).toBe(dummyMembership);
  });

  test("4. Should return 403 when permission effect is DENY (Explicit Deny Overrides)", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue(dummyMembership);
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "APPROVE_AWARD" } },
      { effect: "DENY", permission: { key: "APPROVE_AWARD" } }
    ]);

    const req = { user: dummyUser, headers: { "x-organization-id": dummyOrgId } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorizeV2("APPROVE_AWARD")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("5. Should return 403 when permission is NOT granted", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue(dummyMembership);
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "VIEW_RFQ" } }
    ]);

    const req = { user: dummyUser, headers: { "x-organization-id": dummyOrgId } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorizeV2("PAY_INVOICE")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
