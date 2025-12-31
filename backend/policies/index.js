// Policy Registry
// All policies must be pure functions accepting (user, resource, context)

const RequestPolicy = require('./RequestPolicy');
const QuotePolicy = require('./QuotePolicy');
const UserPolicy = require('./UserPolicy');
const CityPolicy = require('./CityPolicy');

const policies = {
    'Request': RequestPolicy,
    'Quote': QuotePolicy,
    'User': UserPolicy,
    'City': CityPolicy
};

module.exports = policies;
