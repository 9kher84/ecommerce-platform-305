const { chromium, expect } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    Authentication: 'NOT VERIFIED',
    BuyerDashboard: 'NOT VERIFIED',
    SellerDashboard: 'NOT VERIFIED',
    AdminDashboard: 'NOT VERIFIED',
    Notifications: 'NOT VERIFIED',
    Upload: 'NOT VERIFIED',
    Search: 'NOT VERIFIED',
    Reports: 'NOT VERIFIED',
    Profile: 'NOT VERIFIED',
    Settings: 'NOT VERIFIED'
  };

  const baseUrl = 'http://localhost:3000';
  const timestamp = Date.now();
  const buyerEmail = `audit_buyer_${timestamp}@test.com`;
  const sellerEmail = `audit_seller_${timestamp}@test.com`;

  try {
    console.log('[1] Testing Authentication & Registration');
    await page.goto(baseUrl + '/register');
    await page.fill('#name', 'Audit Buyer');
    await page.fill('#email', buyerEmail);
    await page.fill('#password', 'Password123!');
    await page.fill('#confirmPassword', 'Password123!');
    await page.fill('#sectorIds', '1');
    await page.selectOption('select[name="role"]', 'buyer');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    results.Authentication = 'PASS';

    console.log('[2] Testing Buyer Dashboard');
    const dashboardResponse = await page.waitForResponse(res => res.url().includes('/api/dashboard/buyer/stats') && res.status() === 200, { timeout: 10000 }).catch(() => null);
    if (dashboardResponse) results.BuyerDashboard = 'PASS';
    else results.BuyerDashboard = 'FAIL';

    console.log('[3] Testing Upload (Intake)');
    await page.goto(baseUrl + '/requests/new');
    await page.waitForSelector('button:has-text("تحليل الطلب")');
    results.Upload = 'FAIL'; // Because there is no real file upload input for S3

    console.log('[4] Testing Notifications');
    await page.goto(baseUrl + '/dashboard');
    const notifResponse = await page.waitForResponse(res => res.url().includes('/unread-count') && res.status() === 200, { timeout: 10000 }).catch(() => null);
    const hasNotifUI = await page.$('text=الإشعارات').catch(() => null);
    if (notifResponse && hasNotifUI) results.Notifications = 'PASS';
    else results.Notifications = 'FAIL';

    console.log('[5] Testing Search');
    await page.goto(baseUrl + '/requests');
    const searchInput = await page.$('input[placeholder="ابحث..."]');
    if (searchInput) results.Search = 'PASS';
    else results.Search = 'FAIL';

    console.log('[6] Testing Profile & Settings');
    await page.goto(baseUrl + '/settings/profile').catch(()=>null);
    if (page.url().includes('/settings/profile')) results.Profile = 'PASS';
    else results.Profile = 'FAIL';
    
    await page.goto(baseUrl + '/settings').catch(()=>null);
    if (page.url().includes('/settings')) results.Settings = 'PASS';
    else results.Settings = 'FAIL';

    console.log('[7] Testing Reports');
    await page.goto(baseUrl + '/reports').catch(()=>null);
    if (page.url().includes('/reports')) results.Reports = 'PASS';
    else results.Reports = 'FAIL';

    console.log('[8] Testing Admin');
    await page.goto(baseUrl + '/admin').catch(()=>null);
    if (page.url().includes('/admin')) results.AdminDashboard = 'PASS';
    else results.AdminDashboard = 'FAIL';

    console.log('[9] Testing Seller Dashboard');
    await page.evaluate(() => { localStorage.removeItem('token'); });
    await page.goto(baseUrl + '/register');
    await page.fill('#name', 'Audit Seller');
    await page.fill('#email', sellerEmail);
    await page.fill('#password', 'Password123!');
    await page.fill('#confirmPassword', 'Password123!');
    await page.fill('#sectorIds', '1');
    await page.selectOption('select[name="role"]', 'seller');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    const sellerDashboardResponse = await page.waitForResponse(res => res.url().includes('/api/dashboard/seller/stats') && res.status() === 200, { timeout: 10000 }).catch(() => null);
    if (sellerDashboardResponse) results.SellerDashboard = 'PASS';
    else results.SellerDashboard = 'FAIL';

  } catch (e) {
    console.log('Error during audit:', e.message);
  } finally {
    console.log('\n=== JSON RESULTS ===');
    console.log(JSON.stringify(results));
    await browser.close();
  }
})();
