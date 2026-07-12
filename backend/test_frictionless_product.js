const request = require('supertest');
const app = require('./server'); // Assuming app exported from server.js
const { User, Product } = require('./sequelize_setup');
const jwt = require('jsonwebtoken');

async function testProductAddition() {
  try {
    await app.startServer(false); // Mount routes and connect DB

    // Find or create a seller
    let seller = await User.findOne({ where: { role: 'seller' } });
    if (!seller) {
      console.log('No seller found to test with.');
      process.exit(0);
    }
    
    // Generate Token
    const token = jwt.sign({ id: seller.id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });

    console.log('Testing single frictionless product addition...');
    const res1 = await request(app)
      .post('/api/products')
      .set('Cookie', `token=${token}`)
      .send({
        name: 'منتج سريع التجربة',
        estimatedPrice: 50
      });
      
    if (res1.status === 201) {
      console.log('✅ Frictionless product creation successful! Default unit applied:', res1.body.product.unit);
    } else {
      console.error('❌ Failed:', res1.status, res1.body);
    }

    // Now let's try exceeding 20 products
    console.log('Testing exceeding 20 products limit...');
    let successCount = 0;
    for (let i = 0; i < 22; i++) {
        const resBulk = await request(app)
        .post('/api/products')
        .set('Cookie', `token=${token}`)
        .send({
            name: `منتج تجريبي رقم ${i}`,
        });
        if (resBulk.status === 201) successCount++;
    }
    
    console.log(`✅ Bulk creation test completed. Successfully created ${successCount}/22 products.`);
    
    if (successCount >= 20) {
        console.log('✅ 20-product limit successfully bypassed!');
    }

  } catch (error) {
    console.error('Error in test:', error);
  }
  process.exit();
}

testProductAddition();
