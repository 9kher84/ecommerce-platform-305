/**
 * Agent Conversation Engine
 * Manages active conversation sessions, message history, and thread contexts across all channels.
 */
class AgentConversationEngine {
  constructor() {
    this.conversations = new Map();
  }

  /**
   * Get or create a conversation session
   */
  getOrCreateSession(sessionId, context) {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, {
        id: sessionId,
        userId: context?.userId,
        organizationId: context?.organizationId,
        channel: context?.channel || "WEB",
        startedAt: new Date().toISOString(),
        messages: [],
        summary: ""
      });
    }
    return this.conversations.get(sessionId);
  }

  /**
   * Append a message to conversation thread
   */
  appendMessage(sessionId, sender, content, metadata = {}) {
    const session = this.conversations.get(sessionId);
    if (!session) throw new Error(`Conversation session '${sessionId}' not found.`);

    const messageObj = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender, // 'USER' | 'AGENT' | 'SYSTEM'
      content,
      metadata,
      timestamp: new Date().toISOString()
    };

    session.messages.push(messageObj);
    return messageObj;
  }

  /**
   * Retrieve recent conversation history
   */
  getHistory(sessionId, limit = 10) {
    const session = this.conversations.get(sessionId);
    if (!session) return [];
    return session.messages.slice(-limit);
  }
}

const agentConversationEngine = new AgentConversationEngine();

module.exports = {
  AgentConversationEngine,
  agentConversationEngine
};
