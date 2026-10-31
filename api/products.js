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
        // ---------------------------------------------------------
        // GET: Public - Fetch product catalog
        // ---------------------------------------------------------
        if (req.method === 'GET') {
            const category = req.query?.category || null;
            const search = req.query?.search || null;
            const id = req.query?.id || null;

            if (id) {
                const product = await db.getProductById(id);
                if (!product) {
                    return sendJson(res, 404, { error: 'Product not found' });
                }
                return sendJson(res, 200, { product });
            }

            const products = await db.getProducts({ category, search });
            return sendJson(res, 200, {
                count: products.length,
                products
            });
        }

        // ---------------------------------------------------------
        // ADMIN AUTH CHECK for mutations (POST, PUT, DELETE)
        // ---------------------------------------------------------
        const token = extractAdminToken(req);
        const adminSession = db.verifyAdminToken(token);

        if (!adminSession) {
            return sendJson(res, 401, {
                error: 'Unauthorized. Admin authentication token required to modify products.'
            });
        }

        // ---------------------------------------------------------
        // POST: Add new product
        // ---------------------------------------------------------
        if (req.method === 'POST') {
            const body = await parseBody(req);
            const {
                name,
                category,
                category_name,
                price,
                original_price,
                material,
                description,
                image_url,
                badge,
                in_stock
            } = body;

            if (!name || price === undefined || price === null || isNaN(Number(price))) {
                return sendJson(res, 400, {
                    error: 'Product name and a valid numeric price are required.'
                });
            }

            const newProduct = await db.createProduct({
                name,
                category: category || 'decor',
                category_name,
                price: Number(price),
                original_price: original_price ? Number(original_price) : null,
                material: material || 'Tough Resin / Composite',
                description: description || '',
                image_url: image_url || 'assets/hero_render.png',
                badge: badge || '',
                in_stock: in_stock !== undefined ? in_stock : true
            });

            return sendJson(res, 201, {
                success: true,
                message: 'Product created successfully',
                product: newProduct
            });
        }

        // ---------------------------------------------------------
        // PUT: Update existing product (Price, Photo, Description, Stock)
        // ---------------------------------------------------------
        if (req.method === 'PUT' || req.method === 'PATCH') {
            const body = await parseBody(req);
            const id = body.id || req.query?.id;

            if (!id) {
                return sendJson(res, 400, { error: 'Product ID is required for update.' });
            }

            const updatedProduct = await db.updateProduct(id, body);
            if (!updatedProduct) {
                return sendJson(res, 404, { error: `Product with ID '${id}' not found.` });
            }

            return sendJson(res, 200, {
                success: true,
                message: 'Product updated successfully',
                product: updatedProduct
            });
        }

        // ---------------------------------------------------------
        // DELETE: Remove product from catalog
        // ---------------------------------------------------------
        if (req.method === 'DELETE') {
            const body = await parseBody(req);
            const id = req.query?.id || body.id;

            if (!id) {
                return sendJson(res, 400, { error: 'Product ID is required for deletion.' });
            }

            const deleted = await db.deleteProduct(id);
            if (!deleted) {
                return sendJson(res, 404, { error: `Product with ID '${id}' not found.` });
            }

            return sendJson(res, 200, {
                success: true,
                message: `Product '${id}' deleted successfully`
            });
        }

        return sendJson(res, 405, { error: 'Method Not Allowed' });
    } catch (err) {
        console.error('[Products API Error]:', err);
        return sendJson(res, 500, { error: err.message });
    }
};
