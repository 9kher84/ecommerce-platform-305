const {
  detectSelfTrading,
  getDeviceFingerprint,
  logFraudAttempt,
} = require("../../utils/fraudDetection");

describe("Fraud Detection Utils", () => {
  describe("detectSelfTrading", () => {
    it("should return true when fingerprints match", () => {
      const buyerFingerprint = "DEVICE-123-ABC";
      const sellerFingerprint = "DEVICE-123-ABC";

      const result = detectSelfTrading(buyerFingerprint, sellerFingerprint);

      expect(result).toBe(true);
    });

    it("should return false when fingerprints are different", () => {
      const buyerFingerprint = "DEVICE-123-ABC";
      const sellerFingerprint = "DEVICE-456-XYZ";

      const result = detectSelfTrading(buyerFingerprint, sellerFingerprint);

      expect(result).toBe(false);
    });

    it("should return false when buyer fingerprint is null", () => {
      const buyerFingerprint = null;
      const sellerFingerprint = "DEVICE-456-XYZ";

      const result = detectSelfTrading(buyerFingerprint, sellerFingerprint);

      expect(result).toBe(false);
    });

    it("should return false when seller fingerprint is null", () => {
      const buyerFingerprint = "DEVICE-123-ABC";
      const sellerFingerprint = null;

      const result = detectSelfTrading(buyerFingerprint, sellerFingerprint);

      expect(result).toBe(false);
    });

    it("should handle case sensitivity", () => {
      const buyerFingerprint = "device-123-abc";
      const sellerFingerprint = "DEVICE-123-ABC";

      const result = detectSelfTrading(buyerFingerprint, sellerFingerprint);

      // Should be case-sensitive
      expect(result).toBe(false);
    });
  });

  describe("getDeviceFingerprint", () => {
    it("should return fingerprint from request header", () => {
      const req = {
        headers: {
          "x-device-fingerprint": "TEST-FINGERPRINT-123",
        },
      };

      const result = getDeviceFingerprint(req);

      expect(result).toBe("TEST-FINGERPRINT-123");
    });

    it("should return fingerprint from body if header missing", () => {
      const req = {
        headers: {},
        body: {
          deviceFingerprint: "BODY-FINGERPRINT-456",
        },
      };

      const result = getDeviceFingerprint(req);

      expect(result).toBe("BODY-FINGERPRINT-456");
    });

    it("should generate fingerprint from IP and User-Agent when both missing", () => {
      const req = {
        headers: {
          "user-agent": "TestAgent/1.0",
        },
        socket: {
          remoteAddress: "127.0.0.1",
        },
      };

      const result = getDeviceFingerprint(req);

      expect(result).toContain("127.0.0.1");
      expect(result).toContain("TestAgent/1.0");
    });

    it("should handle missing headers and socket", () => {
      const req = {};

      const result = getDeviceFingerprint(req);

      expect(result).toContain("unknown-ip");
      expect(result).toContain("unknown-ua");
    });
  });

  describe("logFraudAttempt", () => {
    let consoleWarnSpy;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it("should log fraud attempt with type and details", () => {
      const type = "SELF_TRADING";
      const details = {
        userId: "user-123",
        requestId: 456,
        reason: "Self-trading detected",
      };

      logFraudAttempt(type, details);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("FRAUD DETECTED"),
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(type),
      );
    });

    it("should handle missing parameters gracefully", () => {
      expect(() => {
        logFraudAttempt(null, null);
      }).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should log details as JSON", () => {
      const details = { test: "value" };

      logFraudAttempt("TEST", details);

      const lastCall =
        consoleWarnSpy.mock.calls[consoleWarnSpy.mock.calls.length - 1];
      expect(lastCall[0]).toContain("Details");
    });
  });
});
