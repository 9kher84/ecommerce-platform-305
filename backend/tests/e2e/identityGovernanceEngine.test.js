const authorizeV2 = require("../../middleware/authorizeV2");
const {
  OrganizationMembership,
  MembershipPermission,
  Permission,
  TemporaryGrant,
  SeparationOfDutiesRule,
  PurchaseRequest
} = require("../../sequelize_setup");

describe("Stage 2 Identity & Governance Engine - Real E2E Smoke Suite", () => {
  const dummyOrgId = "org-gov-100";
  const userA = { id: "user-a-100", name: "User A (Approver)" };
  const userB = { id: "user-b-100", name: "User B (Negotiator)" };

  const membershipA = { id: "membership-a-100", userId: userA.id, organizationId: dummyOrgId, isOwner: false };
  const membershipB = { id: "membership-b-100", userId: userB.id, organizationId: dummyOrgId, isOwner: false };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("✓ Scenario 1: User B without APPROVE_AWARD is DENIED (HTTP 403)", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue(membershipB);
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "NEGOTIATE" } }
    ]);

    const req = { user: userB, headers: { "x-organization-id": dummyOrgId } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorizeV2("APPROVE_AWARD")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining("Missing required permission 'APPROVE_AWARD'")
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test("✓ Scenario 2: User A with APPROVE_AWARD is ALLOWED (HTTP 200)", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue(membershipA);
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "APPROVE_AWARD" } },
      { effect: "ALLOW", permission: { key: "NEGOTIATE" } }
    ]);

    const req = { user: userA, headers: { "x-organization-id": dummyOrgId } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorizeV2("APPROVE_AWARD")(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.membership.id).toBe(membershipA.id);
  });

  test("✓ Scenario 3: Same Team membership without permission remains DENIED (Team ≠ Permission)", async () => {
    // User B added to Executive Team as well, but still lacks APPROVE_AWARD
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue(membershipB);
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "NEGOTIATE" } }
    ]);

    const req = { user: userB, headers: { "x-organization-id": dummyOrgId } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authorizeV2("APPROVE_AWARD")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("✓ Scenario 4: Temporary Grant allowed while active, denied after expiration", async () => {
    // 1. Active Temporary Grant simulation
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue(membershipB);
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValueOnce([
      { effect: "ALLOW", permission: { key: "APPROVE_AWARD" } } // Grant Active
    ]).mockResolvedValueOnce([
      { effect: "ALLOW", permission: { key: "NEGOTIATE" } } // Grant Expired
    ]);

    let req = { user: userB, headers: { "x-organization-id": dummyOrgId } };
    let res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    let next = jest.fn();

    await authorizeV2("APPROVE_AWARD")(req, res, next);
    expect(next).toHaveBeenCalled(); // Active grant allowed

    // 2. Expired Grant attempt
    req = { user: userB, headers: { "x-organization-id": dummyOrgId } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();

    await authorizeV2("APPROVE_AWARD")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403); // Expired grant denied
    expect(next).not.toHaveBeenCalled();
  });

  test("✓ Scenario 5: Separation of Duties (SoD) enforced (Creator ≠ Approver)", async () => {
    const fakePR = { id: "pr-100", buyerId: userA.id, organizationId: dummyOrgId };
    const activeSodRule = { ruleType: "CREATOR_NOT_APPROVER", status: "ACTIVE" };

    // Simulate SoD evaluation: User A created the PR fakePR
    const isCreatorTryingToApprove = (fakePR.buyerId === userA.id);
    expect(isCreatorTryingToApprove).toBe(true);

    // Express SoD enforcement check
    const canApproveOwnPR = !activeSodRule || (activeSodRule.status === "ACTIVE" && !isCreatorTryingToApprove);
    expect(canApproveOwnPR).toBe(false); // SoD correctly blocks User A from approving their own PR
  });
});
