const db = require('../../lib/db');
const { setCorsHeaders, parseBody, sendJson } = require('../../lib/utils');

module.exports = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method Not Allowed. Use POST to authenticate.' });
    }

    try {
        const body = await parseBody(req);
        const { email, password } = body;

        if (!email || !password) {
            return sendJson(res, 400, { error: 'Both email and password are required.' });
        }

        const authResult = db.validateAdmin(email, password);
        if (!authResult) {
            return sendJson(res, 401, { error: 'Invalid admin credentials. Access denied.' });
        }

        return sendJson(res, 200, {
            success: true,
            message: 'Admin authenticated successfully',
            token: authResult.token,
            admin: authResult.admin
        });
    } catch (err) {
        console.error('[Admin Login API Error]:', err);
        return sendJson(res, 500, { error: err.message });
    }
};
