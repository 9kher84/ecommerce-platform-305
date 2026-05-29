const { User, ActionLog, sequelize } = require("../sequelize_setup");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

/**
 * 🛡️ Sovereign Edit Controller
 * Hardened to prevent unauthorized privilege escalation and sensitive field modification
 */
const EditController = {
  /**
   * @description Generic edit function with high-security hardening
   * @route PATCH /api/admin/edit-field
   */
  editAnyField: catchAsync(async (req, res, next) => {
    const { targetId, modelName, fieldName, newValue } = req.body;
    const adminId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // 🟥 RED LINE: Forbidden fields check
    const forbiddenFields = [
      "isAdmin",
      "role",
      "OWNER_ID",
      "password",
      "email",
      "adminPermissions",
    ];
    if (forbiddenFields.includes(fieldName)) {
      // Log intrusion attempt
      await ActionLog.create({
        adminId,
        targetId: targetId || "N/A",
        fieldName: fieldName,
        oldValue: "ATTEMPTED_ACCESS",
        newValue: "FORBIDDEN_FIELD",
        ipAddress,
        timestamp: new Date(),
      });

      return next(
        new AppError(
          "SECURITY BREACH ATTEMPT: Modification of sensitive system fields is STRICTLY FORBIDDEN.",
          403,
        ),
      );
    }

    // 1. Resolve Model (For now restricting to User model as per directive context)
    if (modelName !== "User") {
      return next(
        new AppError("Target model not supported for generic edit.", 400),
      );
    }

    const targetUser = await User.findByPk(targetId);
    if (!targetUser) {
      return next(new AppError("Target user not found.", 404));
    }

    const oldValue = String(targetUser[fieldName]);

    // 2. SOVEREIGN LOGGING (Mandatory prior to execution)
    try {
      await ActionLog.create({
        adminId,
        targetId,
        fieldName,
        oldValue,
        newValue: String(newValue),
        ipAddress,
        timestamp: new Date(),
      });
      console.log(
        `🛡️  ActionLog recorded: Admin ${adminId} modified ${fieldName} for ${targetId}`,
      );
    } catch (logError) {
      console.error(
        "❌ FATAL: Logging failed. Aborting modification.",
        logError,
      );
      return next(
        new AppError(
          "System Integrity Check Failed: Action could not be logged. Modification aborted.",
          500,
        ),
      );
    }

    // 3. Absolute Action: Execute update
    const updates = {};
    updates[fieldName] = newValue;
    await targetUser.update(updates);

    res.status(200).json({
      success: true,
      message: `Field ${fieldName} updated successfully and logged.`,
      data: {
        targetId,
        fieldName,
        newValue,
      },
    });
  }),

  // Undo Edit (Placeholder)
  undoEdit: async (req, res) => {
    res.status(501).json({ error: "Not implemented yet" });
  },
};

module.exports = EditController;
