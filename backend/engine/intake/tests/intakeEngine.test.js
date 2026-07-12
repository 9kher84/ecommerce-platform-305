const UniversalIntakeService = require("../UniversalIntakeService");
const HeuristicParser = require("../parsers/HeuristicParser");
const IOpportunityParser = require("../interfaces/IOpportunityParser");
const SyntaxValidator = require("../validators/SyntaxValidator");
const PricingValidator = require("../validators/PricingValidator");
const ValidationPipeline = require("../validators/ValidationPipeline");
const CommercialOpportunityDTO = require("../domain/CommercialOpportunityDTO");

describe("Universal Intake Engine - Phase 2", () => {
  
  describe("1. HeuristicParser (Unit Tests)", () => {
    let parser;

    beforeEach(() => {
      parser = new HeuristicParser();
    });

    it("should parse SUPPLY text correctly", async () => {
      const text = "يوجد 100 حبة لاب توب للبيع بسعر 2500";
      const dto = await parser.parse(text);
      
      expect(dto).toBeInstanceOf(CommercialOpportunityDTO);
      expect(dto.type).toBe("SUPPLY");
      expect(dto.price).toBe(2500);
      expect(dto.quantity).toBe(100);
      expect(dto.unit).toBe("حبة");
    });

    it("should parse DEMAND text correctly", async () => {
      const text = "مطلوب 50 طن حديد تسليح";
      const dto = await parser.parse(text);
      
      expect(dto.type).toBe("DEMAND");
      expect(dto.quantity).toBe(50);
      expect(dto.unit).toBe("طن");
      expect(dto.price).toBeNull(); // No price mentioned
    });
  });

  describe("2. Validation Pipeline (Unit Tests)", () => {
    it("should accumulate errors from validators", async () => {
      const syntaxValidator = new SyntaxValidator();
      // Mock pricing engine
      const mockPricingEngine = {
        generatePriceRecommendation: jest.fn().mockResolvedValue({ suggestedPrice: 100 })
      };
      const pricingValidator = new PricingValidator(mockPricingEngine);
      
      const pipeline = new ValidationPipeline([syntaxValidator, pricingValidator]);
      
      // Empty DTO (fails syntax)
      const dto = new CommercialOpportunityDTO({});
      const result = await pipeline.execute(dto, {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Missing opportunity type (SUPPLY or DEMAND)");
      expect(result.errors).toContain("Opportunity name is required");
    });

    it("should provide suggestions using injected mock PricingEngine", async () => {
      const syntaxValidator = new SyntaxValidator();
      const mockPricingEngine = {
        generatePriceRecommendation: jest.fn().mockResolvedValue({ suggestedPrice: 1500 })
      };
      const pricingValidator = new PricingValidator(mockPricingEngine);
      const pipeline = new ValidationPipeline([syntaxValidator, pricingValidator]);
      
      const dto = new CommercialOpportunityDTO({
        type: "SUPPLY",
        name: "Test Item",
        quantity: 10
        // No price provided
      });
      
      const result = await pipeline.execute(dto, {});
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes("Price is missing"))).toBe(true);
      expect(result.suggestions.some(s => s.includes("1500"))).toBe(true);
      expect(result.metadata.suggestedPrice).toBe(1500);
      
      expect(mockPricingEngine.generatePriceRecommendation).toHaveBeenCalled();
    });
  });

  describe("3. UniversalIntakeService (Unit Tests)", () => {
    it("should orchestrate parsing and validation statelessly", async () => {
      // Mock Parser
      const mockParser = new IOpportunityParser();
      mockParser.parse = jest.fn().mockResolvedValue(new CommercialOpportunityDTO({ type: "DEMAND", name: "Mock" }));
      
      // Mock Pipeline
      const mockPipeline = new ValidationPipeline();
      mockPipeline.execute = jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [], suggestions: [], metadata: {} });

      const service = new UniversalIntakeService(mockParser, mockPipeline);
      
      const result = await service.processRawInput("Raw input text", { userId: 1 });
      
      expect(mockParser.parse).toHaveBeenCalledWith("Raw input text");
      expect(mockPipeline.execute).toHaveBeenCalled();
      expect(result.correlationId).toBeDefined();
      expect(result.opportunity.type).toBe("DEMAND");
    });
  });

  describe("4. Integration Test: Full Phase 2 Cycle (Memory Only, No DB)", () => {
    it("should process a full raw text request into a validated draft", async () => {
      // Setup DI
      const parser = new HeuristicParser();
      const syntaxValidator = new SyntaxValidator();
      const mockPricingEngine = {
        generatePriceRecommendation: jest.fn().mockResolvedValue({ suggestedPrice: 50 })
      };
      const pricingValidator = new PricingValidator(mockPricingEngine);
      const pipeline = new ValidationPipeline([syntaxValidator, pricingValidator]);
      const intakeService = new UniversalIntakeService(parser, pipeline);

      // Raw Text
      const rawInput = "مطلوب 1000 كرتون مياه شرب بسعر 15";
      
      // Execute
      const finalDraft = await intakeService.processRawInput(rawInput, { userId: "mock-user" });
      
      // Assert
      expect(finalDraft.correlationId).toBeDefined();
      
      // Assert DTO
      expect(finalDraft.opportunity).toBeInstanceOf(CommercialOpportunityDTO);
      expect(finalDraft.opportunity.type).toBe("DEMAND");
      expect(finalDraft.opportunity.price).toBe(15);
      expect(finalDraft.opportunity.quantity).toBe(1000);
      
      // Assert Validation
      expect(finalDraft.validation.isValid).toBe(true); // Should pass syntax
      // Since price is provided, generatePriceRecommendation is not called
      expect(mockPricingEngine.generatePriceRecommendation).not.toHaveBeenCalled();
    });

    it("should demonstrate interchangeable Parser (OpenAI Mock)", async () => {
      // Imagine an OpenAIParser that implements IOpportunityParser
      class MockOpenAIParser extends IOpportunityParser {
        async parse(input) {
          // AI extracts perfectly
          return new CommercialOpportunityDTO({
            type: "SUPPLY",
            name: "AI Extracted Product",
            price: 500,
            quantity: 2,
            metadata: { aiConfidence: 0.99 }
          });
        }
      }

      const aiParser = new MockOpenAIParser();
      const pipeline = new ValidationPipeline([new SyntaxValidator()]);
      
      // Inject AI parser instead of heuristic
      const intakeService = new UniversalIntakeService(aiParser, pipeline);
      
      const finalDraft = await intakeService.processRawInput("Some complex text", {});
      
      expect(finalDraft.opportunity.name).toBe("AI Extracted Product");
      expect(finalDraft.opportunity.metadata.aiConfidence).toBe(0.99);
      expect(finalDraft.validation.isValid).toBe(true);
    });
  });
});
