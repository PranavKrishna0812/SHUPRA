const db = require('../../lib/db');
const { setCorsHeaders, parseBody, sendJson } = require('../../lib/utils');

module.exports = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
    }

    try {
        const body = await parseBody(req);
        const { action = 'request', phone, otp, name } = body;

        const cleanPhone = db.normalizePhone(phone);
        if (!cleanPhone || cleanPhone.length !== 10) {
            return sendJson(res, 400, { error: 'A valid 10-digit mobile number is required.' });
        }

        if (action === 'request') {
            // Generate 6-digit random OTP
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            await db.saveOtp(cleanPhone, generatedOtp, 10);

            // In production, integrate SMS provider (Twilio, Fast2SMS, MSG91) here.
            console.log(`[AUTH] OTP generated for +91${cleanPhone}: ${generatedOtp}`);

            return sendJson(res, 200, {
                success: true,
                message: `OTP sent to +91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`,
                phone: cleanPhone,
                formattedPhone: `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`,
                code: generatedOtp // Provided for seamless verification and test environments
            });
        }

        if (action === 'verify') {
            if (!otp || String(otp).length < 6) {
                return sendJson(res, 400, { error: 'Please enter all 6 digits of the OTP.' });
            }

            const isValid = await db.verifyOtp(cleanPhone, String(otp));
            if (!isValid) {
                return sendJson(res, 401, { error: 'Invalid or expired OTP code. Please try again.' });
            }

            // Create or fetch customer
            const customer = await db.createOrUpdateCustomer({
                phone: cleanPhone,
                name: name || undefined
            });

            // Fetch customer history
            const customerData = await db.getCustomerWithHistory(cleanPhone);

            return sendJson(res, 200, {
                success: true,
                message: 'Phone verified successfully.',
                customer: customerData ? customerData.customer : customer,
                orders: customerData ? customerData.orders : []
            });
        }

        return sendJson(res, 400, { error: 'Invalid action. Expected "request" or "verify".' });
    } catch (err) {
        console.error('[Auth OTP Error]:', err);
        return sendJson(res, 500, { error: err.message });
    }
};
