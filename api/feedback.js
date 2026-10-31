const db = require('../lib/db');
const { setCorsHeaders, parseBody, sendJson } = require('../lib/utils');

module.exports = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const list = await db.getAllFeedback();
            return sendJson(res, 200, { feedback: list, count: list.length });
        }

        if (req.method === 'POST') {
            const body = await parseBody(req);
            const { phone, rating, category, comments } = body;

            if (!rating) {
                return sendJson(res, 400, { error: 'Rating (1-5 stars) is required.' });
            }

            const saved = await db.saveFeedback({
                phone: phone || 'Guest',
                rating: parseInt(rating, 10),
                category: category || 'General Quality',
                comments: comments || ''
            });

            return sendJson(res, 201, {
                success: true,
                message: 'Thank you for your review!',
                feedback: saved
            });
        }

        return sendJson(res, 405, { error: 'Method Not Allowed' });
    } catch (err) {
        console.error('[Feedback API Error]:', err);
        return sendJson(res, 500, { error: err.message });
    }
};
