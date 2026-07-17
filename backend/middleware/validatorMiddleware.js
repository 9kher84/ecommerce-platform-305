const Joi = require("joi");

/**
 * Middleware to validate request body against a Joi schema
 * @param {Joi.ObjectSchema} schema - The Joi schema to validate against
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    // Controller expects { header, items, invitations }
    // Schema validates only the header content
    const dataToValidate = req.body.header !== undefined ? req.body.header : req.body;

    const { error } = schema.validate(dataToValidate, { abortEarly: false, allowUnknown: true });

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
