/**
 * Artillery Processor
 * يوفر دوال مساعدة لاختبارات Artillery
 */

module.exports = {
    setAuthToken: setAuthToken,
    generateRandomString: generateRandomString
};

function setAuthToken(requestParams, context, ee, next) {
    // في بيئة الإنتاج، يجب الحصول على token حقيقي
    // هنا نستخدم token تجريبي
    context.vars.authToken = process.env.TEST_AUTH_TOKEN || 'test-token';
    return next();
}

function generateRandomString(requestParams, context, ee, next) {
    context.vars.randomString = Math.random().toString(36).substring(7);
    return next();
}
