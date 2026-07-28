/**
 * Agent Marketplace & Package Manager Service
 * Manages agent store catalog, enterprise installation, package lifecycle, and developer revenue sharing.
 */
class AgentMarketplaceService {
  constructor() {
    this.catalog = new Map();
    this.installedAgents = new Map(); // orgId -> Set of agentIds
    this.registerDefaultMarketplaceCatalog();
  }

  /**
   * Register default enterprise agents in Marketplace Store
   */
  registerDefaultMarketplaceCatalog() {
    const defaultAgents = [
      { id: "agent-sap-erp", name: "SAP ERP Integration Agent", category: "ERP", author: "SAP Partner Labs", priceMonthly: 199, installedCount: 42, rating: 4.9, description: "Synchronizes purchase requisitions and purchase orders with SAP S/4HANA automatically." },
      { id: "agent-oracle-fin", name: "Oracle Financials Agent", category: "FINANCE", author: "Oracle Ecosystem", priceMonthly: 149, installedCount: 35, rating: 4.8, description: "Automates invoice matching and budget verification with Oracle Cloud Financials." },
      { id: "agent-customs-zatca", name: "Saudi ZATCA & Customs Agent", category: "COMPLIANCE", author: "KSA Legal Tech", priceMonthly: 99, installedCount: 128, rating: 5.0, description: "Ensures 100% E-Invoicing ZATCA Phase 2 compliance and Saudi Customs tariff auditing." },
      { id: "agent-aramco-spec", name: "Aramco Standards Procurement Agent", category: "ENERGY", author: "Industrial AI Solutions", priceMonthly: 299, installedCount: 18, rating: 4.9, description: "Validates technical compliance against Saudi Aramco Material System Specifications (SAMSS)." }
    ];

    defaultAgents.forEach(agent => {
      this.catalog.set(agent.id, agent);
    });
  }

  /**
   * Get store catalog with optional category filtering
   */
  getCatalog(category) {
    const list = Array.from(this.catalog.values());
    if (category) {
      return list.filter(a => a.category.toUpperCase() === category.toUpperCase());
    }
    return list;
  }

  /**
   * Install an Agent Package for an Organization
   */
  installAgent(organizationId, agentId) {
    const agent = this.catalog.get(agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found in Marketplace catalog.`);
    }

    if (!this.installedAgents.has(organizationId)) {
      this.installedAgents.set(organizationId, new Map());
    }

    const orgInstalledMap = this.installedAgents.get(organizationId);
    const installRecord = {
      agentId,
      agentName: agent.name,
      installedAt: new Date().toISOString(),
      status: "ACTIVE"
    };

    orgInstalledMap.set(agentId, installRecord);
    return installRecord;
  }

  /**
   * Get all installed agents for an Organization
   */
  getInstalledAgents(organizationId) {
    const orgMap = this.installedAgents.get(organizationId);
    if (!orgMap) return [];
    return Array.from(orgMap.values());
  }
}

const agentMarketplaceService = new AgentMarketplaceService();

module.exports = {
  AgentMarketplaceService,
  agentMarketplaceService
};
