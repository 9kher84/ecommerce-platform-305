const { agentLifecycleManager } = require("../../services/agentLifecycleManager");
const { sovereignSecretsVault } = require("../../services/sovereignSecretsVault");
const { promptRegistry } = require("../../services/promptRegistry");

describe("Sovereign Operational Layer Unit Suite", () => {
  const agentId = "agent-comm-100";

  test("1. Agent Lifecycle Manager: should set and transition agent state", () => {
    const record = agentLifecycleManager.setAgentState(agentId, "RUNNING", "Manual launch from console");
    expect(record.status).toBe("RUNNING");

    const current = agentLifecycleManager.getAgentState(agentId);
    expect(current.status).toBe("RUNNING");
  });

  test("2. Secrets Vault & Disaster Kill Switch: should store secrets and trigger emergency shutdown", () => {
    sovereignSecretsVault.setSecret("OPENAI_API_KEY", "sk-proj-test123456789");
    const secret = sovereignSecretsVault.getSecret("OPENAI_API_KEY");
    expect(secret).toBe("sk-proj-test123456789");

    expect(sovereignSecretsVault.isKillSwitchActive()).toBe(false);
    sovereignSecretsVault.triggerDisasterKillSwitch("Emergency test shutdown");
    expect(sovereignSecretsVault.isKillSwitchActive()).toBe(true);

    sovereignSecretsVault.resetDisasterKillSwitch();
    expect(sovereignSecretsVault.isKillSwitchActive()).toBe(false);
  });

  test("3. Prompt Registry: should register, active, and retrieve prompt templates", () => {
    promptRegistry.registerPrompt("TEST_PROMPT", "v1.0.0", "Test Prompt Content");
    const active = promptRegistry.getActivePrompt("TEST_PROMPT");
    expect(active).toBe("Test Prompt Content");
  });
});
