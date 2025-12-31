try {
    console.log('Loading uuid...');
    const { v4 } = require('uuid');
    console.log('UUID loaded:', typeof v4);

    console.log('Loading config...');
    const config = require('../backend/config');
    console.log('Config loaded');

    console.log('Loading User model file...');
    const UserFn = require('../backend/models/User'); // It exports a function
    console.log('User model file loaded:', typeof UserFn);

    console.log('Loading sequelize_setup...');
    const setup = require('../backend/sequelize_setup');
    console.log('Sequelize setup loaded');
} catch (error) {
    console.error('DEBUG ERROR:', error);
}
