const { City, Sequelize } = require('../sequelize_setup');

/**
 * City Adapter (Legacy Data Normalization)
 * 
 * Responsibility:
 * Bridge the gap between "Legacy String Cities" and "New UUID Cities".
 * Ensures Logic/Policy layers only ever see standardized IDs.
 */
class CityAdapter {
    /**
     * Resolve City Context for a Resource
     * @param {Object} resource - The resource (Request, User, etc.)
     * @returns {Promise<Object>} The resource with normalized cityId/regionId
     */
    static async normalize(resource) {
        // 1. If already normalized (has cityId), return.
        if (resource.cityId) {
            return resource;
        }

        // 2. Check for Legacy String Field
        const legacyCity = resource.delivery_city || resource.city; // Common fields

        if (!legacyCity) {
            // No city dimension implies Global or undefined scope.
            // Be explicit.
            resource.cityId = null;
            return resource;
        }

        // 3. Resolve Legacy String to System ID
        // Optimization: In a real system, use Redis/Memory Cache here.
        try {
            const cityEntity = await City.findOne({
                where: Sequelize.where(
                    Sequelize.fn('lower', Sequelize.col('name')),
                    legacyCity.trim().toLowerCase()
                )
            });

            if (cityEntity) {
                resource.cityId = cityEntity.id;
                resource.regionId = cityEntity.regionId;
            } else {
                // 4. Broken Link handling
                // The string exists but matches no known system city.
                // We treat this as "Unscoped" or "Orphaned".
                // Policy will likely deny "Context Scoped" users from accessing this.
                resource.cityId = null;
                // console.warn(`CityAdapter: Unresolvable city '${legacyCity}' for Resource ${resource.id}`);
            }

        } catch (error) {
            // Database error during lookup? Return safe.
            console.error('CityAdapter Resolution Error:', error);
            resource.cityId = null;
        }

        return resource;
    }
}

module.exports = CityAdapter;
