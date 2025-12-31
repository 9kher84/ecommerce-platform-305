const { Report, User, Deal, PurchaseRequest } = require('../sequelize_setup');
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');

/**
 * @desc    Create a new report
 * @route   POST /api/reports
 * @access  Private
 */
exports.createReport = asyncHandler(async (req, res) => {
    const { type, description, attachmentUrl, purchaseRequestId, dealId } = req.body;
    const reporterId = req.user.id;

    // Validate required fields
    if (!type || !description) {
        res.status(400);
        throw new Error('Please provide report type and description');
    }

    // Validate type
    const validTypes = ['bad_post', 'impersonation', 'fraud', 'deal_corruption', 'other'];
    if (!validTypes.includes(type)) {
        res.status(400);
        throw new Error('Invalid report type');
    }

    // Create report
    const report = await Report.create({
        reporterId,
        type,
        description,
        attachmentUrl,
        purchaseRequestId: purchaseRequestId || null,
        dealId: dealId || null,
        status: 'pending'
    });

    res.status(201).json({
        success: true,
        message: 'Report submitted successfully',
        report
    });
});

/**
 * @desc    Get all reports (Admin only)
 * @route   GET /api/reports
 * @access  Private (Admin/Super Admin)
 */
exports.getReports = asyncHandler(async (req, res) => {
    const { status, type } = req.query;
    const where = {};

    if (status) where.status = status;
    if (type) where.type = type;

    const reports = await Report.findAll({
        where,
        include: [
            {
                model: User,
                as: 'reporter',
                attributes: ['id', 'name', 'email', 'role']
            },
            {
                model: PurchaseRequest,
                as: 'reportedRequest',
                attributes: ['id', 'title']
            },
            {
                model: Deal,
                as: 'reportedDeal',
                attributes: ['id', 'status']
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        count: reports.length,
        reports
    });
});

/**
 * @desc    Update report status (Admin only)
 * @route   PATCH /api/reports/:id/status
 * @access  Private (Admin/Super Admin)
 */
exports.updateReportStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const report = await Report.findByPk(id);
    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    const validStatuses = ['pending', 'investigating', 'resolved', 'dismissed'];
    if (!status || !validStatuses.includes(status)) {
        res.status(400);
        throw new Error('Invalid status');
    }

    await report.update({ status });

    res.status(200).json({
        success: true,
        message: 'Report status updated',
        report
    });
});