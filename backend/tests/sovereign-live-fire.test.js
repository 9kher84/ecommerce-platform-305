const request = require("supertest");
const app = require("../server");
// Initialize Honeypot Model manually for test
const { sequelize } = require("../config/database");
const { AdminCredentialsBackup } = require("../models/HoneypotModels")(
  sequelize,
);

describe("🚨 Live Fire Exercise: Honeypot & AI Shield", () => {
  // Command 4: Live Fire Exercise (Mocked version for Jest)
  test("1. Honeypot Attack mechanics trigger Kill Switch", async () => {
    // Need to mock the kill switch to avoid actually killing the test runner process
    const sovereignKillSwitch = require("../scripts/kill-switch");
    const killSpy = jest
      .spyOn(sovereignKillSwitch, "isolateDatabase")
      .mockResolvedValue(true);
    const blockSpy = jest
      .spyOn(sovereignKillSwitch, "blockIncomingConnections")
      .mockResolvedValue(true);
    const persistSpy = jest
      .spyOn(sovereignKillSwitch, "persistSystemState")
      .mockResolvedValue(true);

    // Mock process.exit
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});

    // Mock AuditLog.create to avoid DB write issues during mocked test or speed it up
    const { AuditLog } = require("../sequelize_setup");
    const auditSpy = jest.spyOn(AuditLog, "create").mockResolvedValue(true);

    const startTime = Date.now();

    try {
      // Force trigger
      await AdminCredentialsBackup.findOne();
    } catch (e) {
      // Expected
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // This test verifies the LOGIC path, not the exact timing (script does timing)
    expect(killSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);

    killSpy.mockRestore();
    exitSpy.mockRestore();
    blockSpy.mockRestore();
    persistSpy.mockRestore();
    auditSpy.mockRestore();
  });

  // Command 3: AI Shield Verification
  test("2. AI Shield Redacts Sensitive IP and Table Names", async () => {
    const responseStub = {
      data: "User from 192.168.1.50 accessed admin_credentials_backup table.",
      meta: {
        host: "10.0.0.5",
      },
    };

    // Create a temporary route for testing
    // Note: Express apps are mutable, adding route after start is possible
    app.post("/test/ai-echo", (req, res) => {
      res.json(req.body);
    });

    const res = await request(app).post("/test/ai-echo").send(responseStub);

    expect(res.status).toBe(200);

    // Assert Redaction
    expect(res.text).not.toContain("192.168.1.50");
    expect(res.text).not.toContain("10.0.0.5");
    expect(res.text).not.toContain("admin_credentials_backup");

    expect(res.text).toContain("[REDACTED_BY_SOVEREIGN_PROTOCOL]");
  });
});
