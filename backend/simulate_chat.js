const { io } = require('socket.io-client');
const { PurchaseRequest, PriceQuote } = require('./sequelize_setup');

async function simulateChat() {
    console.log('--- STARTING CHAT SIMULATION ---');
    
    const request = await PurchaseRequest.findOne({ where: { status: 'deal_in_progress' }, order: [['createdAt', 'DESC']] });
    if (!request) {
        console.log('❌ No request found in deal_in_progress state');
        process.exit(1);
    }
    
    const quote = await PriceQuote.findOne({ where: { purchaseRequestId: request.id, status: 'accepted' } });
    if (!quote) {
        console.log('❌ No accepted quote found');
        process.exit(1);
    }
    
    const buyerId = request.userId;
    const sellerId = quote.sellerId;
    
    console.log(`✅ Found Deal Context: Request ${request.id}, Buyer ${buyerId}, Seller ${sellerId}`);
    
    const buyerSocket = io('http://localhost:5000', {
        auth: { userId: buyerId },
        reconnection: false
    });
    
    buyerSocket.on('connect', () => {
        console.log('✅ Buyer connected to Socket.IO');
        
        buyerSocket.emit('join_request', { requestId: request.id });
        
        buyerSocket.emit('send_message', {
            requestId: request.id,
            receiverId: sellerId,
            content: 'Hello Seller, please provide the tracking number.',
            messageType: 'text'
        });
        
        setTimeout(() => {
            console.log('✅ Message sent through Socket.IO');
            buyerSocket.disconnect();
            process.exit(0);
        }, 1500);
    });
    
    buyerSocket.on('error', (err) => {
        console.log('❌ Socket Error:', err);
    });
}

simulateChat().catch(console.error);
