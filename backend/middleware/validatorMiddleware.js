const Joi = require("joi");

/**
 * Middleware to validate request body against a Joi schema
 * @param {Joi.ObjectSchema} schema - The Joi schema to validate against
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });

    if (error) {
      console.log("VALIDATION ERROR DETAILS:", error.details);
      const errors = error.details.map((detail) => detail.message);
      console.log("VALIDATION ERRORS:", errors);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: errors,
      });
    }

    next();
  };
};

module.exports = validateRequest;
