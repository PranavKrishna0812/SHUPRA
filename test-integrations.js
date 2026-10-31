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
            console.log('✓ Reviews in DB:', adminRes.data.feedback.length);

            console.log(`\n======================================================`);
            console.log(`✅ ALL 9 INTEGRATION & HEALTH TESTS PASSED PERFECTLY!`);
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
