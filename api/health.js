const db = require('../lib/db');
const { setCorsHeaders, sendJson } = require('../lib/utils');

module.exports = async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const dbHealth = await db.healthCheck();
        const stats = await db.getStats();

        return sendJson(res, 200, {
            status: 'ok',
            service: 'Shupra 3D API',
            version: '1.0.0',
            uptime: process.uptime(),
            nodeVersion: process.version,
            database: dbHealth,
            overview: stats,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('[Health Check Error]:', err);
        return sendJson(res, 500, {
            status: 'error',
            message: err.message,
            timestamp: new Date().toISOString()
        });
    }
};
