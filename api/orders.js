const db = require('../lib/db');
const { setCorsHeaders, parseBody, sendJson } = require('../lib/utils');

module.exports = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET: Search / Fetch orders
        if (req.method === 'GET') {
            const { phone, orderNumber, status, limit } = req.query || {};

            if (orderNumber) {
                const singleOrder = await db.getOrderById(orderNumber);
                if (!singleOrder) {
                    return sendJson(res, 404, { error: `Order ${orderNumber} not found.` });
                }
                return sendJson(res, 200, { order: singleOrder });
            }

            const orders = await db.getOrders({ phone, orderNumber, status, limit });
            return sendJson(res, 200, { orders, count: orders.length });
        }

        // POST: Place & Book new order
        if (req.method === 'POST') {
            const body = await parseBody(req);
            const {
                customerPhone,
                phone,
                customerName,
                name,
                customerAddress,
                address,
                customerEmail,
                email,
                items,
                total,
                totalAmount,
                subtotal,
                shippingCost,
                paymentMethod,
                fileName,
                fileNames,
                fileBase64,
                customFileUrl,
                notes
            } = body;

            const orderPhone = customerPhone || phone;
            if (!orderPhone) {
                return sendJson(res, 400, { error: 'Customer phone number is required to place an order.' });
            }

            const cleanPhone = db.normalizePhone(orderPhone);
            if (cleanPhone.length !== 10) {
                return sendJson(res, 400, { error: 'Please provide a valid 10-digit mobile number.' });
            }

            const orderData = {
                customerPhone: cleanPhone,
                customerName: customerName || name || 'Valued Customer',
                customerAddress: customerAddress || address || '',
                customerEmail: customerEmail || email || '',
                items: Array.isArray(items) ? items : (typeof items === 'string' ? [{ name: items }] : []),
                totalAmount: totalAmount || total || 0,
                subtotal: subtotal || totalAmount || total || 0,
                shippingCost: shippingCost || 0,
                paymentMethod: paymentMethod || 'UPI / Online Payment',
                paymentStatus: 'PAID',
                orderStatus: 'ORDER_PLACED',
                fileName: fileName || fileNames || '',
                fileNames: fileNames || fileName || '',
                fileBase64: fileBase64 || null,
                customFileUrl: customFileUrl || null,
                notes: notes || ''
            };

            const savedOrder = await db.createOrder(orderData);
            const customerHistory = await db.getCustomerWithHistory(cleanPhone);

            return sendJson(res, 201, {
                success: true,
                message: `Order #${savedOrder.order_number} successfully placed and registered.`,
                order: savedOrder,
                customer: customerHistory ? customerHistory.customer : null
            });
        }

        // PATCH: Update Order Status
        if (req.method === 'PATCH') {
            const body = await parseBody(req);
            const { orderNumber, status, trackingNumber, notes } = body;

            if (!orderNumber || !status) {
                return sendJson(res, 400, { error: 'Both orderNumber and status are required.' });
            }

            const updatedOrder = await db.updateOrderStatus(orderNumber, status, trackingNumber, notes);
            if (!updatedOrder) {
                return sendJson(res, 404, { error: `Order ${orderNumber} not found.` });
            }

            return sendJson(res, 200, {
                success: true,
                message: `Order #${orderNumber} status updated to ${status}.`,
                order: updatedOrder
            });
        }

        return sendJson(res, 405, { error: 'Method Not Allowed' });
    } catch (err) {
        console.error('[Orders API Error]:', err);
        return sendJson(res, 500, { error: err.message });
    }
};
