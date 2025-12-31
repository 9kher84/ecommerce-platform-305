const asyncHandler = require('express-async-handler');
const { SystemSetting } = require('../sequelize_setup');

const checkAIEnabled = async (res) => {
    const setting = await SystemSetting.findOne({ where: { key: 'ai_features_enabled' } });
    const isEnabled = setting && setting.value === 'true';

    if (!isEnabled) {
        res.status(503).json({
            success: false,
            message: 'AI System Not Active'
        });
        return false;
    }
    return true;
};

/**
 * @desc    Ask Learning Bot
 * @route   POST /api/ai/learn
 * @access  Protected
 */
exports.askLearningBot = asyncHandler(async (req, res) => {
    if (!(await checkAIEnabled(res))) return;
    res.status(200).json({ success: true, message: 'Learning Bot response placeholder' });
});

/**
 * @desc    Payment Assistant
 * @route   POST /api/ai/payment-assist
 * @access  Protected
 */
exports.paymentAssistant = asyncHandler(async (req, res) => {
    if (!(await checkAIEnabled(res))) return;
    res.status(200).json({ success: true, message: 'Payment Assistant response placeholder' });
});

/**
 * @desc    Smart Support
 * @route   POST /api/ai/support
 * @access  Protected
 */
exports.smartSupport = asyncHandler(async (req, res) => {
    if (!(await checkAIEnabled(res))) return;
    res.status(200).json({ success: true, message: 'Smart Support response placeholder' });
});
