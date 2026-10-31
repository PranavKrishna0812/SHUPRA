const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing & URL encoding
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Bridge Vercel serverless function handlers into Express
const healthHandler = require('./api/health');
const authOtpHandler = require('./api/auth/otp');
const customersHandler = require('./api/customers');
const ordersHandler = require('./api/orders');
const feedbackHandler = require('./api/feedback');
const adminHandler = require('./api/admin');

app.all('/api/health', (req, res) => healthHandler(req, res));
app.all('/api/auth/otp', (req, res) => authOtpHandler(req, res));
app.all('/api/customers', (req, res) => customersHandler(req, res));
app.all('/api/orders', (req, res) => ordersHandler(req, res));
app.all('/api/feedback', (req, res) => feedbackHandler(req, res));
app.all('/api/admin', (req, res) => adminHandler(req, res));

// Direct route aliases
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/collection', (req, res) => {
    res.sendFile(path.join(__dirname, 'collection.html'));
});

// Serve static frontend assets
app.use(express.static(__dirname));

// Fallback for SPA-like navigation
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🚀 SHUPRA Full-Scale Server running on port ${PORT}`);
        console.log(`🌐 Website:      http://localhost:${PORT}`);
        console.log(`🛍️  Collection:   http://localhost:${PORT}/collection`);
        console.log(`📊 Admin Portal: http://localhost:${PORT}/admin`);
        console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
        console.log(`=======================================================`);
    });
}

module.exports = app;
