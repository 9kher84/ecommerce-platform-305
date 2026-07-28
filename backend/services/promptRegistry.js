/**
 * Managed Prompt Registry & Versioning Engine
 * Controls prompt templates, versioning, rollbacks, and A/B testing from the Owner Console.
 */
class PromptRegistry {
  constructor() {
    this.prompts = new Map();
    this.registerDefaultPrompts();
  }

  /**
   * Register default prompt templates
   */
  registerDefaultPrompts() {
    this.registerPrompt("COMMERCIAL_AGENT_PROMPT", "v4.0.0", "You are Chief Commercial Procurement Agent for MarketHub. Analyze market RFQs, compare supplier quotations, and enforce organization governance limits.");
    this.registerPrompt("FINANCE_AGENT_PROMPT", "v2.1.0", "You are Finance & Budget Validation Agent. Audit commercial invoices against approved Purchase Orders and budget limits.");
    this.registerPrompt("RISK_AGENT_PROMPT", "v3.0.0", "You are Market Risk & Collusion Auditor Agent. Detect supplier fraud, price gouging, and Separation of Duties violations.");
  }

  /**
   * Register or update prompt version
   */
  registerPrompt(promptKey, version, templateContent) {
    if (!this.prompts.has(promptKey)) {
      this.prompts.set(promptKey, []);
    }
    const versions = this.prompts.get(promptKey);
    const newVersionRecord = {
      promptKey,
      version,
      templateContent,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Mark previous active versions as inactive
    versions.forEach(v => v.isActive = false);
    versions.push(newVersionRecord);
    return newVersionRecord;
  }

  /**
   * Get active prompt content
   */
  getActivePrompt(promptKey) {
    const versions = this.prompts.get(promptKey);
    if (!versions || versions.length === 0) return "Default Agent Prompt Context";
    const active = versions.find(v => v.isActive) || versions[versions.length - 1];
    return active.templateContent;
  }
}

const promptRegistry = new PromptRegistry();

module.exports = {
  PromptRegistry,
  promptRegistry
};
