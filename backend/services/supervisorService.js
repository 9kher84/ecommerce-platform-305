const {
  Deal,
  SupervisorAssignment,
  SupervisorCommissionShare,
  SupervisorNotification,
  RegionAssignment,
  EventLog,
} = require("../sequelize_setup");
const AppError = require("../utils/appError");
// Optionally import OpenClaw WhatsApp bridge if needed

class SupervisorService {
  static async assignDealToSupervisor(dealId, supervisorId, assignedByUserId) {
    const deal = await Deal.findByPk(dealId);
    if (!deal) throw new AppError("Deal not found", 404);

    const platform_share = parseFloat(
      process.env.PLATFORM_COMMISSION_PERCENTAGE || 2.0,
    );
    const supervisor_share = parseFloat(
      process.env.SUPERVISOR_COMMISSION_PERCENTAGE || 0.5,
    );

    const assignment = await SupervisorAssignment.create({
      deal_id: dealId,
      supervisor_id: supervisorId,
      assigned_by: assignedByUserId,
      platform_share,
      supervisor_share,
    });

    const amount = (deal.finalAmount * supervisor_share) / 100;

    await SupervisorCommissionShare.create({
      assignment_id: assignment.id,
      supervisor_id: supervisorId,
      deal_id: dealId,
      amount,
      status: "pending",
    });

    await this.sendSupervisorNotification(
      supervisorId,
      "assignment",
      "New Deal Assigned",
      `You have been assigned to deal ${dealId}`,
      "normal",
      dealId,
      { amount },
    );

    return assignment;
  }

  static async getSupervisorDeals(supervisorId, filters = {}) {
    return await SupervisorAssignment.findAll({
      where: { supervisor_id: supervisorId },
      include: [
        {
          model: Deal,
          as: "deal",
          include: ["buyer", "seller"],
        },
      ],
    });
  }

  static async getSupervisorCommissions(supervisorId, filters = {}) {
    const where = { supervisor_id: supervisorId };
    if (filters.status) where.status = filters.status;

    return await SupervisorCommissionShare.findAll({
      where,
      include: [
        {
          model: Deal,
          as: "deal",
        },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  static async sendSupervisorNotification(
    supervisorId,
    type,
    title,
    message,
    priority = "normal",
    dealId = null,
    metadata = {},
  ) {
    const notification = await SupervisorNotification.create({
      supervisor_id: supervisorId,
      type,
      title,
      message,
      priority,
      deal_id: dealId,
      metadata,
    });

    try {
      const NotificationService = require("./notificationService");
      const io = NotificationService.io;
      if (io) {
        io.of("/supervisor_notifications")
          .to(`supervisor_${supervisorId}`)
          .emit("new_notification", notification);
      }
    } catch (e) {
      console.error("WebSocket Error:", e);
    }

    return notification;
  }

  static async markCommissionAsPaid(commissionShareId, adminUserId) {
    const commission =
      await SupervisorCommissionShare.findByPk(commissionShareId);
    if (!commission) throw new AppError("Commission Share not found", 404);

    commission.status = "paid";
    commission.paid_at = new Date();
    await commission.save();

    await EventLog.create({
      actorId: adminUserId,
      actorRole: "admin",
      entityType: "supervisor_commission",
      entityId: commission.id,
      actionType: "commission_paid",
      beforeState: { status: "pending" },
      afterState: { status: "paid" },
    });

    return commission;
  }

  static async assignRegionToSupervisor(
    supervisorId,
    regionName,
    assignedByUserId,
  ) {
    return await RegionAssignment.create({
      supervisor_id: supervisorId,
      region_name: regionName,
      assigned_by: assignedByUserId,
    });
  }
}

module.exports = SupervisorService;
