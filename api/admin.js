const db = require('../lib/db');
const { setCorsHeaders, parseBody, sendJson } = require('../lib/utils');

function extractAdminToken(req) {
    const auth = req.headers['authorization'] || req.headers['x-admin-token'];
    if (!auth) return null;
    if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
        return auth.substring(7).trim();
    }
    return auth;
}

module.exports = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const stats = await db.getStats();
            const customers = await db.getAllCustomers();
            const orders = await db.getOrders({ limit: 100 });
            const feedback = await db.getAllFeedback();
            const products = await db.getProducts();

            return sendJson(res, 200, {
                stats,
                customers,
                orders,
                feedback,
                products
            });
        }

        if (req.method === 'PATCH') {
            const body = await parseBody(req);
            const { orderNumber, status, trackingNumber, notes } = body;

            if (!orderNumber || !status) {
                return sendJson(res, 400, { error: 'orderNumber and status are required.' });
            }

            const updated = await db.updateOrderStatus(orderNumber, status, trackingNumber, notes);
            if (!updated) {
                return sendJson(res, 404, { error: `Order ${orderNumber} not found.` });
            }

            return sendJson(res, 200, {
                success: true,
                order: updated
            });
        }

        return sendJson(res, 405, { error: 'Method Not Allowed' });
    } catch (err) {
        console.error('[Admin API Error]:', err);
        return sendJson(res, 500, { error: err.message });
    }
};
