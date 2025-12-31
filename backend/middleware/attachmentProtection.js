const { PurchaseRequest, Deal, PriceQuote, Attachment } = require('../sequelize_setup');

/**
 * ========================================================================
 * COMMAND 3: ATTACHMENT PROTECTION MIDDLEWARE
 * ========================================================================
 * حماية المرفقات بناءً على حالة الطلب ودور المستخدم
 * يتم تطبيقه على مسار GET /api/attachments/:id
 */
const protectAttachment = async (req, res, next) => {
    try {
        const attachmentId = req.params.id;
        const user = req.user; // مفترض أن الـ JWT middleware قام بملء req.user

        if (!user) {
            return res.status(401).json({ success: false, message: 'Authentication required to access attachments' });
        }

        // ⚠️ يجب التأكد من أنك تستطيع جلب purchaseRequestId من الـ Attachment
        // (هذا يعتمد على Model الـ Attachment الخاص بك)
        const attachment = await Attachment.findByPk(attachmentId);

        if (!attachment || !attachment.purchaseRequestId) {
            return res.status(404).json({ success: false, message: 'Attachment or associated request not found' });
        }

        const requestId = attachment.purchaseRequestId;
        const request = await PurchaseRequest.findByPk(requestId);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Associated request not found' });
        }

        const requestStatus = request.status;
        const isOwner = request.buyerId === user.id;
        const isAdmin = user.role === 'admin' || user.role === 'super_admin';

        // ========================================================================
        // COMMAND 3: STRICT ACCESS CONTROL LOGIC (5 CONDITIONS)
        // ========================================================================

        // ✅ CONDITION 1: المدير (admin / super_admin) - وصول كامل دائماً
        if (isAdmin) {
            console.log(`✅ [Attachment Access] Admin ${user.id} accessing attachment ${attachmentId}`);
            return next();
        }

        // ✅ CONDITION 2: المشتري صاحب الطلب - وصول كامل دائماً
        if (isOwner) {
            console.log(`✅ [Attachment Access] Request owner ${user.id} accessing attachment ${attachmentId}`);
            return next();
        }

        // ✅ CONDITION 3: البائع الفائز (لديه عرض سعر مُقبول)
        // يجب التحقق من هذا أولاً قبل التحقق من الحالة العامة
        const winningQuote = await PriceQuote.findOne({
            where: {
                purchaseRequestId: requestId,
                status: 'accepted'
            }
        });

        if (winningQuote && user.id === winningQuote.sellerId) {
            console.log(`✅ [Attachment Access] Winning seller ${user.id} accessing attachment ${attachmentId}`);
            return next();
        }

        // ✅ CONDITION 4: الحالة العامة (published أو negotiating) - السماح لأي بائع
        if (['published', 'negotiating'].includes(requestStatus)) {
            if (user.role === 'seller') {
                console.log(`✅ [Attachment Access] Seller ${user.id} accessing attachment for ${requestStatus} request`);
                return next();
            }

            // رفض للمشترين الآخرين
            return res.status(403).json({
                success: false,
                message: `❌ FORBIDDEN: Only sellers can view attachments for ${requestStatus} requests`
            });
        }

        // ❌ CONDITION 5: الرفض القاطع (HTTP 403 Forbidden)
        // جميع الحالات الأخرى، خاصةً accepted/completed/failed للبائعين غير الفائزين
        return res.status(403).json({
            success: false,
            message: `❌ FORBIDDEN: Attachments for ${requestStatus} requests are restricted. ` +
                `Access is only allowed for: request owner, winning seller, or admin.`
        });

    } catch (error) {
        console.error('Error in attachment protection middleware:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { protectAttachment };
