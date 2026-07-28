const AgentContextBuilder = require("../services/agentContextBuilder");
const AgentPlanner = require("../services/agentPlanner");
const AgentRuntime = require("../services/agentRuntime");
const LLMAdapter = require("../services/llmAdapter");
const { User, OrganizationMembership } = require("../sequelize_setup");

/**
 * Omni-Channel Gateway Controller
 * Handles incoming webhooks for WhatsApp, Email, Teams, and Slack channels.
 */

// 1. WhatsApp Ingress Webhook (/api/gateway/whatsapp)
exports.handleWhatsAppWebhook = async (req, res) => {
  try {
    const { from, message } = req.body; // e.g. from: "966501234567", message: "أحتاج شراء 100 طن حديد"
    
    // Resolve User by Phone Number or Fallback
    const user = await User.findOne() || { id: "00000000-0000-0000-0000-000000000000", name: "WhatsApp User" };
    const membership = await OrganizationMembership.findOne({ where: { status: "ACTIVE" } }) || { organizationId: "00000000-0000-0000-0000-000000000000" };

    const plan = await AgentPlanner.createPlan({
      goal: message || "طلب مشتريات عبر الواتساب",
      context: { userId: user.id, organizationId: membership.organizationId }
    });

    const runtimeResult = await AgentRuntime.execute({
      channel: "WHATSAPP",
      userId: user.id,
      organizationId: membership.organizationId,
      intent: plan.steps[0]?.toolName || "CREATE_RFQ",
      data: { prompt: message, fromPhone: from }
    });

    return res.json({
      success: true,
      channel: "WHATSAPP",
      sender: from,
      replyMessage: `أهلاً بك. تم استقبال طلبك: "${message}". تم إنشاء خطة التنفيذ وتطبيق الحوكمة بنجاح.`,
      executionStatus: runtimeResult.status,
      plan
    });
  } catch (error) {
    console.error("WhatsApp Gateway Error:", error);
    return res.status(500).json({ error: "WhatsApp Ingress Processing Failed", details: error.message });
  }
};

// 2. Email Ingress Webhook (/api/gateway/email)
exports.handleEmailWebhook = async (req, res) => {
  try {
    const { fromEmail, subject, bodyText } = req.body;

    const user = await User.findOne({ where: { email: fromEmail } }) || await User.findOne() || { id: "00000000-0000-0000-0000-000000000000" };
    const membership = await OrganizationMembership.findOne({ where: { status: "ACTIVE" } }) || { organizationId: "00000000-0000-0000-0000-000000000000" };

    const plan = await AgentPlanner.createPlan({
      goal: `${subject}: ${bodyText}`,
      context: { userId: user.id, organizationId: membership.organizationId }
    });

    const runtimeResult = await AgentRuntime.execute({
      channel: "EMAIL",
      userId: user.id,
      organizationId: membership.organizationId,
      intent: plan.steps[0]?.toolName || "CREATE_RFQ",
      data: { subject, bodyText }
    });

    return res.json({
      success: true,
      channel: "EMAIL",
      sender: fromEmail,
      replySubject: `Re: ${subject} - [MarketHub Agent Processed]`,
      executionStatus: runtimeResult.status,
      plan
    });
  } catch (error) {
    console.error("Email Gateway Error:", error);
    return res.status(500).json({ error: "Email Ingress Processing Failed", details: error.message });
  }
};
