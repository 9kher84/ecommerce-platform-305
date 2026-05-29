const { User, sequelize } = require("../sequelize_setup");
const { Op } = require("sequelize");
const { logAdminAction } = require("../services/adminActionLogService");

const AdminController = {
  // Get all admins
  getAdmins: async (req, res) => {
    try {
      const admins = await User.findAll({
        where: {
          isAdmin: true,
        },
        attributes: [
          "id",
          "name",
          "email",
          "role",
          "isAdmin",
          "adminPermissions",
          "adminCreatedBy",
          "adminCreatedAt",
          "adminStatus",
          "lastLogin",
        ],
        include: [
          {
            model: User,
            as: "adminCreator",
            attributes: ["id", "name"],
          },
        ],
        limit: 500, // Safety Cap for Order 1 compliance
      });
      res.json({ success: true, data: admins });
    } catch (error) {
      console.error("Get Admins Error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch admins" });
    }
  },

  // Make a user an admin
  addAdmin: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { userId, permissions, settings } = req.body;

      // 1. Validate Input
      if (!userId || !permissions) {
        return res
          .status(400)
          .json({
            success: false,
            error: "User ID and Permissions are required",
          });
      }

      // 2. Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // 3. Update User
      await user.update(
        {
          isAdmin: true,
          role: "admin", // Force role update if needed, or keep original role but give admin powers
          adminPermissions: permissions,
          adminCreatedBy: req.user.id,
          adminCreatedAt: new Date(),
          adminStatus: settings && settings.status ? settings.status : "active",
        },
        { transaction: t },
      );

      await t.commit();

      await logAdminAction(
        req.user.id,
        "ADD_ADMIN",
        "user",
        user.id,
        { permissions, settings },
        req.ip,
      );

      res.json({
        success: true,
        message: "Admin added successfully",
        data: {
          id: user.id,
          name: user.name,
          isAdmin: true,
        },
      });
    } catch (error) {
      await t.rollback();
      console.error("Add Admin Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update admin permissions
  updateAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const { permissions, status } = req.body;

      const admin = await User.findByPk(id);
      if (!admin) {
        return res
          .status(404)
          .json({ success: false, error: "Admin not found" });
      }

      if (!admin.isAdmin) {
        return res
          .status(400)
          .json({ success: false, error: "User is not an admin" });
      }

      // Prevent editing the Owner if you are not the Owner (though middleware should catch this via isOwner usually)
      if (
        admin.id === process.env.OWNER_ID &&
        req.user.id !== process.env.OWNER_ID
      ) {
        return res
          .status(403)
          .json({ success: false, error: "Cannot modify Owner" });
      }

      const AdminUpdateDTO = require("../dto/AdminUpdateDTO");
      const dto = new AdminUpdateDTO(req.body);
      const { sanitizedData } = dto.validate();

      const updates = {};
      if (sanitizedData.adminPermissions)
        updates.adminPermissions = sanitizedData.adminPermissions;
      if (sanitizedData.adminStatus)
        updates.adminStatus = sanitizedData.adminStatus;

      await admin.update(updates);

      await logAdminAction(
        req.user.id,
        "UPDATE_ADMIN",
        "user",
        admin.id,
        { updates },
        req.ip,
      );

      res.json({ success: true, message: "Admin updated successfully" });
    } catch (error) {
      console.error("Update Admin Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Remove admin (Revoke Access)
  deleteAdmin: async (req, res) => {
    try {
      const { id } = req.params;

      const admin = await User.findByPk(id);
      if (!admin) {
        return res
          .status(404)
          .json({ success: false, error: "Admin not found" });
      }

      if (admin.id === process.env.OWNER_ID) {
        return res
          .status(403)
          .json({ success: false, error: "Cannot delete Owner" });
      }

      await admin.update({
        isAdmin: false,
        adminPermissions: null,
        adminStatus: "pending",
        role: "buyer", // Revert to default or 'seller' depending on logic, strict safety: buyer
      });

      await logAdminAction(
        req.user.id,
        "REVOKE_ADMIN",
        "user",
        admin.id,
        {},
        req.ip,
      );

      res.json({
        success: true,
        message: "Admin privileges revoked successfully",
      });
    } catch (error) {
      console.error("Delete Admin Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = AdminController;
