const { Attachment } = require('../sequelize_setup');
const path = require('path');
const fs = require('fs');

exports.getAttachment = async (req, res) => {
    try {
        const attachmentId = req.params.id;
        const attachment = await Attachment.findByPk(attachmentId);

        if (!attachment) {
            return res.status(404).json({ success: false, message: 'Attachment not found' });
        }

        const filePath = path.join(__dirname, '..', attachment.filePath); // افترض أن filePath مخزن في قاعدة البيانات

        if (fs.existsSync(filePath)) {
            res.download(filePath, attachment.originalName);
        } else {
            res.status(404).json({ success: false, message: 'File not found on server' });
        }
    } catch (error) {
        console.error('Error serving attachment:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
