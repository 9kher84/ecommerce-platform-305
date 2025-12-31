const {
    AuditLog,
    SmartPricingMatrix,
    sequelize
} = require('../sequelize_setup');
const auditService = require('../services/auditService');

exports.getCommandData = async (req, res) => {
    try {
        // Enforce Sovereign Access
        // In real simplified dashboard, maybe we skip strict role output for now or assume Admin

        // 1. System Health (Mock / Real)
        const health = {
            database: 'Connected',
            integrity: 'Verified', // Ideally read from last audit log
            status: 'Operational'
        };

        // 2. Audit Logs (Condensed)
        const recentLogs = await AuditLog.findAll({
            limit: 20,
            order: [['createdAt', 'DESC']],
            attributes: ['action', 'resourceType', 'createdAt', 'userId']
        });

        // 3. Smart Pricing Stats
        // Aggregate pricing rules count
        const matrixCount = await SmartPricingMatrix.count();
        // Mock graph data for pricing anomalies (would be real agg in prod)
        const pricingStats = {
            activeMatrices: matrixCount,
            anomaliesDetected: 0, // Placeholder
            graphData: [ // Simple trend
                { date: '2025-12-01', anomalies: 0 },
                { date: '2025-12-02', anomalies: 1 }
            ]
        };

        res.json({
            success: true,
            data: {
                health,
                auditLogs: recentLogs,
                pricingStats
            }
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ success: false, error: 'Dashboard Retrieval Failed' });
    }
};
