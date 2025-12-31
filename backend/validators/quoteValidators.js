const Joi = require('joi');

const submitQuoteSchema = Joi.object({
    purchaseRequestId: Joi.string().uuid().required(),
    priceType: Joi.string().valid('fixed', 'flexible').default('fixed'),
    fixedPrice: Joi.number().positive().when('priceType', { is: 'fixed', then: Joi.required() }),
    priceRangeMin: Joi.number().positive().when('priceType', { is: 'flexible', then: Joi.required() }),
    priceRangeMax: Joi.number().positive().greater(Joi.ref('priceRangeMin')).when('priceType', { is: 'flexible', then: Joi.required() }),
    flexibilityReason: Joi.string().when('priceType', { is: 'flexible', then: Joi.required() }),
    currency: Joi.string().default('SAR'),
    canDeliver: Joi.boolean().default(false),
    canInstall: Joi.boolean().default(false),
    deliveryCost: Joi.number().min(0).default(0),
    proposedDates: Joi.array().items(Joi.date()).optional(),
    technicalDetails: Joi.string().optional(),
    invoiceImage: Joi.string().optional()
});

module.exports = {
    submitQuoteSchema
};
