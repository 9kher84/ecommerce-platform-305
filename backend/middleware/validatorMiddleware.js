const Joi = require('joi');

/**
 * Middleware to validate request body against a Joi schema
 * @param {Joi.ObjectSchema} schema - The Joi schema to validate against
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map((detail) => detail.message);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: errors
            });
        }

        next();
    };
};

module.exports = validateRequest;
