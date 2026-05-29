const { getMessage, messages } = require("../../utils/responseMessages");

describe("Response Messages", () => {
  describe("getMessage function", () => {
    it("should return Arabic message by default", () => {
      const message = getMessage("AUTH_REQUIRED");

      expect(message).toBe("يجب تسجيل الدخول للوصول إلى هذه الصفحة");
    });

    it("should return English message when specified", () => {
      const message = getMessage("AUTH_REQUIRED", "en");

      expect(message).toBe("Authentication required to access this resource");
    });

    it("should return key if message not found", () => {
      const message = getMessage("NON_EXISTENT_KEY");

      expect(message).toBe("NON_EXISTENT_KEY");
    });

    it("should handle dynamic messages with parameters", () => {
      const message = getMessage("PLAN_CONTACT_LIMIT", "ar", "Free", 1);

      expect(message).toContain("Free");
      expect(message).toContain("1");
    });

    it("should handle English dynamic messages", () => {
      const message = getMessage("PLAN_CONTACT_LIMIT", "en", "Free", 1);

      expect(message).toContain("Free");
      expect(message).toContain("1");
    });

    it("should return key for invalid language", () => {
      const message = getMessage("AUTH_REQUIRED", "invalid");

      expect(message).toBe("AUTH_REQUIRED");
    });
  });

  describe("Message structure", () => {
    it("should have Arabic messages", () => {
      expect(messages.ar).toBeDefined();
      expect(typeof messages.ar).toBe("object");
    });

    it("should have English messages", () => {
      expect(messages.en).toBeDefined();
      expect(typeof messages.en).toBe("object");
    });

    it("should have authentication messages", () => {
      expect(messages.ar.AUTH_REQUIRED).toBeDefined();
      expect(messages.en.AUTH_REQUIRED).toBeDefined();
    });

    it("should have validation messages", () => {
      expect(messages.ar.VALIDATION_REQUIRED_FIELDS).toBeDefined();
      expect(messages.en.VALIDATION_REQUIRED_FIELDS).toBeDefined();
    });

    it("should have fraud detection messages", () => {
      expect(messages.ar.FRAUD_SELF_TRADING).toBeDefined();
      expect(messages.en.FRAUD_SELF_TRADING).toBeDefined();
    });

    it("should have payment messages", () => {
      expect(messages.ar.PAYMENT_FAILED).toBeDefined();
      expect(messages.en.PAYMENT_FAILED).toBeDefined();
    });
  });

  describe("Dynamic message functions", () => {
    it("should handle PLAN_CONTACT_LIMIT in Arabic", () => {
      const func = messages.ar.PLAN_CONTACT_LIMIT;

      expect(typeof func).toBe("function");
      expect(func("Free", 1)).toContain("Free");
      expect(func("Free", 1)).toContain("1");
    });

    it("should handle PLAN_CONTACT_LIMIT in English", () => {
      const func = messages.en.PLAN_CONTACT_LIMIT;

      expect(typeof func).toBe("function");
      expect(func("Free", 1)).toContain("Free");
      expect(func("Free", 1)).toContain("1");
    });

    it("should handle PLAN_LOC_IMAGES_PLAN_B", () => {
      const funcAr = messages.ar.PLAN_LOC_IMAGES_PLAN_B;
      const funcEn = messages.en.PLAN_LOC_IMAGES_PLAN_B;

      expect(typeof funcAr).toBe("function");
      expect(typeof funcEn).toBe("function");
      expect(funcAr(1)).toContain("1");
      expect(funcEn(1)).toContain("1");
    });
  });

  describe("Message coverage", () => {
    const requiredCategories = [
      "AUTH_REQUIRED",
      "AUTH_INVALID_CREDENTIALS",
      "VALIDATION_REQUIRED_FIELDS",
      "NOT_FOUND_USER",
      "FRAUD_SELF_TRADING",
      "PAYMENT_FAILED",
      "RATE_LIMIT_EXCEEDED",
      "INTERNAL_ERROR",
    ];

    requiredCategories.forEach((key) => {
      it(`should have ${key} in both languages`, () => {
        expect(messages.ar[key]).toBeDefined();
        expect(messages.en[key]).toBeDefined();
      });
    });
  });

  describe("Backward compatibility", () => {
    it("should export ar messages directly", () => {
      const { ar } = require("../../utils/responseMessages");

      expect(ar).toBeDefined();
      expect(ar.AUTH_REQUIRED).toBeDefined();
    });

    it("should export en messages directly", () => {
      const { en } = require("../../utils/responseMessages");

      expect(en).toBeDefined();
      expect(en.AUTH_REQUIRED).toBeDefined();
    });
  });
});
