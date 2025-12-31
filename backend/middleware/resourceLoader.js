const asyncHandler = require('express-async-handler');
const CityAdapter = require('../adapters/CityAdapter');

/**
 * Resource Loader Factory
 * Fetches a resource by ID and attaches it to req.resource.
 * Uses Adapter Pattern to normalize legacy data (e.g. Cities).
 * 
 * @param {Model} Model - Sequelize Model
 * @param {string} paramName - Name of the route parameter (default: 'id')
 * @param {Array} include - Associations to include (optional)
 */
const loadResource = (Model, paramName = 'id', include = []) => asyncHandler(async (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
        return next();
    }

    const resource = await Model.findByPk(id, { include });

    if (!resource) {
        res.status(404);
        throw new Error(`${Model.name} not found`);
    }

    // ------------------------------------------------------------
    // PHASE 3: ADAPTER PATTERN (Data Normalization)
    // ------------------------------------------------------------
    if (Model.name === 'PurchaseRequest' || Model.name === 'User' || Model.name === 'PriceQuote') {
        // Normalize Context (City/Region)
        await CityAdapter.normalize(resource);
    }

    req.resource = resource;
    next();
});

module.exports = loadResource;
