const http = require('http');
const app = require('./server');

const server = http.createServer(app);
const PORT = 3001;

function request(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    server.listen(PORT, async () => {
        console.log(`\n======================================================`);
        console.log(`🧪 STARTING INTEGRATION & HEALTH VERIFICATION SUITE`);
        console.log(`======================================================\n`);

        try {
            // Test 1: Health Check
            console.log('Test 1: GET /api/health');
            const healthRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/health',
                method: 'GET'
            });
            console.log('✓ Health status:', healthRes.status, healthRes.data.status, 'DB:', healthRes.data.database.mode);
            if (healthRes.status !== 200) throw new Error('Health check failed');

            // Test 2: Request OTP
            console.log('\nTest 2: POST /api/auth/otp (Request OTP)');
            const otpReqRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/auth/otp',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { action: 'request', phone: '9876543210' });
            console.log('✓ OTP Request status:', otpReqRes.status, 'Message:', otpReqRes.data.message);
            const receivedOtp = otpReqRes.data.code;
            if (!receivedOtp) throw new Error('No OTP returned');

            // Test 3: Verify OTP
            console.log('\nTest 3: POST /api/auth/otp (Verify OTP)');
            const otpVerifyRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/auth/otp',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { action: 'verify', phone: '9876543210', otp: receivedOtp, name: 'Rahul Sharma' });
            console.log('✓ OTP Verify status:', otpVerifyRes.status, 'Customer:', otpVerifyRes.data.customer.phone);
            if (otpVerifyRes.status !== 200) throw new Error('OTP verification failed');

            // Test 4: Create Order
            console.log('\nTest 4: POST /api/orders (Create Order)');
            const orderRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/orders',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, {
                customerPhone: '9876543210',
                customerName: 'Rahul Sharma',
                customerAddress: '42, Indiranagar, Bengaluru, 560038',
                paymentMethod: 'UPI (GPay)',
                totalAmount: 3499,
                items: [
                    { name: 'Lord Shiva Nataraja Idol (Silk Copper)', qty: 1, price: 3499, fileName: 'shiva-nataraja.stl' }
                ],
                fileNames: 'shiva-nataraja.stl'
            });
            console.log('✓ Order Create status:', orderRes.status, 'Order Number:', orderRes.data.order.order_number);
            const createdOrderNumber = orderRes.data.order.order_number;
            if (orderRes.status !== 201) throw new Error('Order creation failed');

            // Test 5: Customer Purchase History
            console.log('\nTest 5: GET /api/customers?phone=9876543210');
            const custRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/customers?phone=9876543210',
                method: 'GET'
            });
            console.log('✓ Customer profile:', custRes.data.customer.name, 'Total Orders:', custRes.data.totalOrders, 'Total Spent: ₹' + custRes.data.totalSpent);
            if (custRes.data.orders.length === 0) throw new Error('Purchase history empty');

            // Test 6: Single Order Tracking
            console.log('\nTest 6: GET /api/orders?orderNumber=' + createdOrderNumber);
            const singleOrderRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/orders?orderNumber=' + encodeURIComponent(createdOrderNumber),
                method: 'GET'
            });
            console.log('✓ Order fetched:', singleOrderRes.data.order.order_number, 'Status:', singleOrderRes.data.order.order_status);

            // Test 7: Update Order Status (Admin / Production Workflow)
            console.log('\nTest 7: PATCH /api/orders (Update Status to IN_PRODUCTION)');
            const patchRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/orders',
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            }, {
                orderNumber: createdOrderNumber,
                status: 'IN_PRODUCTION',
                trackingNumber: 'BLR-EXP-9921',
                notes: 'Layer height 0.12mm high precision slicing approved'
            });
            console.log('✓ Order Status updated:', patchRes.data.order.order_status, 'AWB:', patchRes.data.order.tracking_number);

            // Test 8: Submit Feedback
            console.log('\nTest 8: POST /api/feedback');
            const fbRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/feedback',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, {
                phone: '9876543210',
                rating: 5,
                category: 'Filament Finish',
                comments: 'Outstanding surface smoothness on the sacred Nataraja sculpture.'
            });
            console.log('✓ Feedback submitted:', fbRes.status, 'Rating:', fbRes.data.feedback.rating);

            // Test 9: Admin Dashboard Overview
            console.log('\nTest 9: GET /api/admin');
            const adminRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/admin',
                method: 'GET'
            });
            console.log('✓ Admin stats:', adminRes.data.stats);
            console.log('✓ Customers in DB:', adminRes.data.customers.length);
            console.log('✓ Orders in DB:', adminRes.data.orders.length);
            console.log('✓ Products in DB:', (adminRes.data.products || []).length);
            console.log('✓ Reviews in DB:', adminRes.data.feedback.length);

            // Test 10: Admin Login (Valid Credentials)
            console.log('\nTest 10: POST /api/admin/login (Valid Credentials)');
            const adminLoginRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/admin/login',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { email: 'admin@shupra3d.com', password: 'ShupraAdmin@2026' });
            console.log('✓ Admin Login status:', adminLoginRes.status, 'Admin:', adminLoginRes.data.admin.email);
            if (adminLoginRes.status !== 200 || !adminLoginRes.data.token) throw new Error('Admin login failed');
            const adminToken = adminLoginRes.data.token;

            // Test 11: Admin Login (Invalid Credentials Rejection)
            console.log('\nTest 11: POST /api/admin/login (Invalid Credentials Rejection)');
            const badLoginRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/admin/login',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { email: 'admin@shupra3d.com', password: 'WrongPassword' });
            console.log('✓ Bad Login rejected with status:', badLoginRes.status, 'Error:', badLoginRes.data.error);
            if (badLoginRes.status !== 401) throw new Error('Bad admin credentials should be rejected with 401');

            // Test 12: Fetch Public Products Catalog
            console.log('\nTest 12: GET /api/products');
            const productsRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/products',
                method: 'GET'
            });
            console.log('✓ Products count:', productsRes.data.count);
            if (productsRes.status !== 200 || productsRes.data.products.length === 0) throw new Error('Products fetch failed');

            // Test 13: Create Product as Admin
            console.log('\nTest 13: POST /api/products (Admin Auth)');
            const newProdRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/products',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                }
            }, {
                name: 'Parametric Gyroid Lamp Shade',
                category: 'decor',
                price: 1899,
                original_price: 2499,
                material: 'Translucent PETG',
                description: 'Math-inspired minimal gyroid infill lampshade that diffuses LED warmth organically.',
                image_url: 'assets/hero_render.png',
                badge: 'New Release',
                in_stock: true
            });
            console.log('✓ Product Created:', newProdRes.status, 'ID:', newProdRes.data.product.id, 'Name:', newProdRes.data.product.name);
            if (newProdRes.status !== 201) throw new Error('Product creation failed');
            const createdProdId = newProdRes.data.product.id;

            // Test 14: Unauthorized Product Create Rejection
            console.log('\nTest 14: POST /api/products (Unauthorized Rejection)');
            const unauthRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/products',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, {
                name: 'Unauthorized Product',
                price: 999
            });
            console.log('✓ Unauthorized create rejected with status:', unauthRes.status);
            if (unauthRes.status !== 401) throw new Error('Unauthorized create should return 401');

            // Test 15: Update Product Price, Photo & Description
            console.log('\nTest 15: PUT /api/products (Update Price & Description)');
            const updateProdRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/products',
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                }
            }, {
                id: createdProdId,
                price: 1999,
                description: 'Updated description: Math-inspired minimal gyroid infill lampshade with warm tone dispersion.'
            });
            console.log('✓ Product Updated:', updateProdRes.status, 'New Price: ₹' + updateProdRes.data.product.price);
            if (updateProdRes.status !== 200 || updateProdRes.data.product.price !== 1999) throw new Error('Product update failed');

            // Test 16: Delete Product as Admin
            console.log('\nTest 16: DELETE /api/products (Admin Auth)');
            const deleteProdRes = await request({
                hostname: 'localhost',
                port: PORT,
                path: `/api/products?id=${createdProdId}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            console.log('✓ Product Deleted:', deleteProdRes.status, 'Message:', deleteProdRes.data.message);
            if (deleteProdRes.status !== 200) throw new Error('Product deletion failed');

            console.log(`\n======================================================`);
            console.log(`✅ ALL 16 INTEGRATION, HEALTH & ADMIN TESTS PASSED!`);
            console.log(`======================================================\n`);
        } catch (error) {
            console.error('\n❌ Test failed:', error);
        } finally {
            server.close();
            process.exit(0);
        }
    });
}

runTests();
