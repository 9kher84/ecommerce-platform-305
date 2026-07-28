/**
 * MarketHub Standardized Base Agent SDK Class
 * Universal class blueprint for building digital employee plugins and third-party custom agents.
 */
class BaseAgent {
  constructor(manifest) {
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error("BaseAgent manifest requires 'id', 'name', and 'version'.");
    }
    this.manifest = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      category: manifest.category || "PROCUREMENT",
      description: manifest.description || "",
      author: manifest.author || "MarketHub Enterprise",
      capabilities: manifest.capabilities || [],
      requiredPermissions: manifest.requiredPermissions || [],
      priceMonthly: manifest.priceMonthly || 0
    };
  }

  /**
   * Main Agent Decision & Reasoning Lifecycle Handler
   */
  async handleReasoning(context, prompt) {
    throw new Error(`Method 'handleReasoning' must be implemented by subclass '${this.manifest.name}'.`);
  }

  /**
   * Package Manifest Exporter
   */
  toManifest() {
    return this.manifest;
  }
}

module.exports = BaseAgent;
