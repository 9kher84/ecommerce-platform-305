/**
 * NotificationService
 * 
 * Manages real-time notifications via Socket.IO
 */
class NotificationService {
    constructor() {
        this.io = null;
    }

    /**
     * Initialize Socket.IO instance
     * @param {Object} io - Socket.IO server instance
     */
    init(io) {
        this.io = io;
        console.log('✅ NotificationService initialized with Socket.IO');

        this.io.on('connection', (socket) => {
            console.log(`🔌 New client connected: ${socket.id}`);

            // Join user to their own room based on user ID (sent via query or auth)
            // Example: client connects with ?userId=123
            const userId = socket.handshake.query.userId;
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`👤 User ${userId} joined room user:${userId}`);
            }

            socket.on('disconnect', () => {
                console.log(`❌ Client disconnected: ${socket.id}`);
            });
        });
    }

    /**
     * Send notification to a specific user
     * @param {string} userId - Target user ID
     * @param {string} type - Notification type (e.g., 'NEW_QUOTE', 'DEAL_ACCEPTED')
     * @param {Object} data - Notification payload
     */
    sendToUser(userId, type, data) {
        if (!this.io) {
            console.warn('⚠️ Socket.IO not initialized in NotificationService');
            return;
        }

        this.io.to(`user:${userId}`).emit('notification', {
            type,
            timestamp: new Date(),
            data
        });

        console.log(`📢 Notification sent to user ${userId}: ${type}`);
    }

    /**
     * Send notification to all admins
     * @param {string} type 
     * @param {Object} data 
     */
    sendToAdmins(type, data) {
        if (!this.io) return;
        this.io.to('admins').emit('admin_notification', {
            type,
            timestamp: new Date(),
            data
        });
    }
}

module.exports = new NotificationService();
