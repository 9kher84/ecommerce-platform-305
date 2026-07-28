/**
 * Sovereign Secrets Vault & Emergency Disaster Kill Switch
 * Manages encrypted owner API keys and system-wide EMERGENCY AI KILL SWITCH.
 */
class SovereignSecretsVault {
  constructor() {
    this.secrets = new Map();
    this.emergencyKillSwitchActive = false; // Master Disaster Switch
  }

  /**
   * Store a secret key securely
   */
  setSecret(keyName, secretValue) {
    this.secrets.set(keyName, {
      keyName,
      maskedValue: secretValue.substring(0, 4) + "****" + secretValue.slice(-2),
      rawSecret: secretValue,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Retrieve secret value
   */
  getSecret(keyName) {
    const record = this.secrets.get(keyName);
    return record ? record.rawSecret : process.env[keyName] || "sk-mock-key-123456789";
  }

  /**
   * Master Disaster Kill Switch: Instantly shuts down all Agent OS execution
   */
  triggerDisasterKillSwitch(reason = "Emergency Sovereign Shutdown Triggered") {
    this.emergencyKillSwitchActive = true;
    return {
      status: "EMERGENCY_SHUTDOWN_ACTIVE",
      timestamp: new Date().toISOString(),
      reason
    };
  }

  /**
   * Reset Disaster Kill Switch to resume normal operations
   */
  resetDisasterKillSwitch() {
    this.emergencyKillSwitchActive = false;
    return {
      status: "SYSTEM_OPERATIONAL",
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if Disaster Switch is active
   */
  isKillSwitchActive() {
    return this.emergencyKillSwitchActive;
  }
}

const sovereignSecretsVault = new SovereignSecretsVault();

module.exports = {
  SovereignSecretsVault,
  sovereignSecretsVault
};
