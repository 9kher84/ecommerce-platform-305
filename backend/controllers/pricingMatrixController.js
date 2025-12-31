const { SellerPricingMatrix, Category } = require('../sequelize_setup');

/**
 * PricingMatrixController
 * Manages seller pricing matrices (Plan B exclusive)
 */
class PricingMatrixController {

    /**
     * Create a new pricing matrix
     */
    static async createMatrix(req, res) {
        try {
            const { name, categoryId, rules, isActive } = req.body;
            const sellerId = req.user.id;

            // Validate Plan B (double check)
            if (req.user.subscriptionTier !== 'plan_b') {
                return res.status(403).json({ error: 'This feature is exclusive to Plan B sellers' });
            }

            const matrix = await SellerPricingMatrix.create({
                sellerId,
                name,
                categoryId: categoryId || null,
                rules: rules || [],
                isActive: isActive !== undefined ? isActive : true
            });

            res.status(201).json(matrix);
        } catch (error) {
            console.error('Error creating matrix:', error);
            res.status(500).json({ error: 'Failed to create pricing matrix' });
        }
    }

    /**
     * Get all matrices for the logged-in seller
     */
    static async getMyMatrices(req, res) {
        try {
            const sellerId = req.user.id;

            const matrices = await SellerPricingMatrix.findAll({
                where: { sellerId },
                include: [
                    {
                        model: Category,
                        as: 'category', // Ensure association exists or remove include if not needed yet
                        attributes: ['id', 'name_ar', 'name_en']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.json(matrices);
        } catch (error) {
            console.error('Error fetching matrices:', error);
            // Fallback if Category association is not set up yet
            try {
                const matrices = await SellerPricingMatrix.findAll({
                    where: { sellerId: req.user.id },
                    order: [['createdAt', 'DESC']]
                });
                res.json(matrices);
            } catch (retryError) {
                res.status(500).json({ error: 'Failed to fetch pricing matrices' });
            }
        }
    }

    /**
     * Update a matrix
     */
    static async updateMatrix(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const sellerId = req.user.id;

            const matrix = await SellerPricingMatrix.findOne({
                where: { id, sellerId }
            });

            if (!matrix) {
                return res.status(404).json({ error: 'Matrix not found' });
            }

            await matrix.update(updates);
            res.json(matrix);
        } catch (error) {
            console.error('Error updating matrix:', error);
            res.status(500).json({ error: 'Failed to update pricing matrix' });
        }
    }

    /**
     * Delete a matrix
     */
    static async deleteMatrix(req, res) {
        try {
            const { id } = req.params;
            const sellerId = req.user.id;

            const deleted = await SellerPricingMatrix.destroy({
                where: { id, sellerId }
            });

            if (!deleted) {
                return res.status(404).json({ error: 'Matrix not found' });
            }

            res.json({ message: 'Matrix deleted successfully' });
        } catch (error) {
            console.error('Error deleting matrix:', error);
            res.status(500).json({ error: 'Failed to delete pricing matrix' });
        }
    }
}

module.exports = PricingMatrixController;
