const db = require('../lib/db');
const { setCorsHeaders, parseBody, sendJson } = require('../lib/utils');

module.exports = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const phone = req.query?.phone;

            if (phone) {
                const customerData = await db.getCustomerWithHistory(phone);
                if (!customerData) {
                    return sendJson(res, 404, { error: 'Customer not found' });
                }
                return sendJson(res, 200, {
                    customer: customerData.customer,
                    orders: customerData.orders,
                    totalOrders: customerData.orders.length,
                    totalSpent: customerData.customer.total_spent
                });
            }

            // Return all customers
            const customers = await db.getAllCustomers();
            return sendJson(res, 200, { customers });
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            const body = await parseBody(req);
            const { phone, name, email, address } = body;

            if (!phone) {
                return sendJson(res, 400, { error: 'Phone number is required' });
            }

            const updated = await db.createOrUpdateCustomer({ phone, name, email, address });
            const withHistory = await db.getCustomerWithHistory(phone);

            return sendJson(res, 200, {
                success: true,
                customer: withHistory ? withHistory.customer : updated,
                orders: withHistory ? withHistory.orders : []
            });
        }

        return sendJson(res, 405, { error: 'Method Not Allowed' });
    } catch (err) {
        console.error('[Customer API Error]:', err);
        return sendJson(res, 500, { error: err.message });
    }
};
