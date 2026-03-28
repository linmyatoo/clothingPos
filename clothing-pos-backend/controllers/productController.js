const db = require('../config/db');
const { minioClient, BUCKET } = require('../config/minio');
const crypto = require('crypto');
const sharp = require('sharp');

exports.uploadProductImage = async (req, res, next) => {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
    }

    try {
        // Check product exists
        const products = await db.query('SELECT id FROM products WHERE id = ?', [id]);
        if (!products.length) return res.status(404).json({ message: 'Product not found' });

        // Generate unique filename and force .webp extension for compression
        const filename = `products/${id}/${crypto.randomUUID()}.webp`;

        // Compress and resize image using sharp (Max width 1000px, 80% quality WebP)
        const compressedBuffer = await sharp(req.file.buffer)
            .resize({ width: 1000, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        // Upload to MinIO
        await minioClient.putObject(BUCKET, filename, compressedBuffer, compressedBuffer.length, {
            'Content-Type': 'image/webp',
        });

        // Build public URL dynamically so it works across different networks/devices
        // Use MINIO_PUBLIC_* env vars to distinguish public URLs from internal Docker networking
        const protocol = process.env.MINIO_PUBLIC_PROTOCOL || (process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http');
        const publicHost = process.env.MINIO_PUBLIC_ENDPOINT || req.hostname || '127.0.0.1';
        const port = process.env.MINIO_PUBLIC_PORT || process.env.MINIO_PORT || 9000;
        const imageUrl = `${protocol}://${publicHost}:${port}/${BUCKET}/${filename}`;

        // Save URL to database
        await db.query('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, id]);

        res.json({ message: 'Image uploaded', image_url: imageUrl });
    } catch (err) {
        next(err);
    }
};
exports.getProducts = async (req, res, next) => {
    const { branch_id } = req.query;

    try {
        let query;
        let params = [];

        if (branch_id) {
            // Include branch-specific stock
            query = `
                SELECT p.*, 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', pv.id,
                            'size', pv.size,
                            'color', pv.color,
                            'cost_price', pv.cost_price,
                            'selling_price', pv.selling_price,
                            'stock_quantity', COALESCE(bs.stock_quantity, 0),
                            'sku', pv.sku
                        )
                    ) AS Variants
                FROM products p
                LEFT JOIN product_variants pv ON pv.product_id = p.id
                LEFT JOIN branch_stock bs ON bs.variant_id = pv.id AND bs.branch_id = ?
                GROUP BY p.id
                ORDER BY p.created_at DESC
            `;
            params = [branch_id];
        } else {
            // No branch filter — show total stock across all branches
            query = `
                SELECT p.*, 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', pv.id,
                            'size', pv.size,
                            'color', pv.color,
                            'cost_price', pv.cost_price,
                            'selling_price', pv.selling_price,
                            'stock_quantity', COALESCE(total_stock.total, 0),
                            'sku', pv.sku
                        )
                    ) AS Variants
                FROM products p
                LEFT JOIN product_variants pv ON pv.product_id = p.id
                LEFT JOIN (
                    SELECT variant_id, SUM(stock_quantity) AS total
                    FROM branch_stock
                    GROUP BY variant_id
                ) total_stock ON total_stock.variant_id = pv.id
                GROUP BY p.id
                ORDER BY p.created_at DESC
            `;
        }

        const products = await db.query(query, params);

        // Parse JSON string variants if needed
        const parsed = products.map(p => ({
            ...p,
            Variants: typeof p.Variants === 'string' ? JSON.parse(p.Variants) : p.Variants
        }));

        // Fetch per-branch stock for all variants and attach to each variant
        const allVariantIds = parsed.flatMap(p => (p.Variants || []).map(v => v.id).filter(Boolean));

        if (allVariantIds.length > 0) {
            const branchStocks = await db.query(`
                SELECT bs.variant_id, bs.branch_id, bs.stock_quantity, b.name AS branch_name
                FROM branch_stock bs
                JOIN branches b ON b.id = bs.branch_id
                WHERE bs.variant_id IN (${allVariantIds.map(() => '?').join(',')})
            `, allVariantIds);

            // Group by variant_id
            const stockMap = {};
            for (const bs of branchStocks) {
                const vid = Number(bs.variant_id);
                if (!stockMap[vid]) stockMap[vid] = [];
                stockMap[vid].push({
                    branch_id: Number(bs.branch_id),
                    branch_name: bs.branch_name,
                    stock_quantity: Number(bs.stock_quantity),
                });
            }

            // Attach to variants
            for (const p of parsed) {
                if (p.Variants) {
                    p.Variants = p.Variants.map(v => ({
                        ...v,
                        branch_stocks: stockMap[v.id] || [],
                    }));
                }
            }
        }

        res.json(parsed);
    } catch (err) {
        next(err);
    }
};

exports.getProductById = async (req, res, next) => {
    const { id } = req.params;
    const { branch_id } = req.query;

    try {
        const products = await db.query(
            'SELECT * FROM products WHERE id = ?', [id]
        );
        if (!products.length) return res.status(404).json({ message: 'Product not found' });

        let variants;
        if (branch_id) {
            variants = await db.query(
                `SELECT pv.*, COALESCE(bs.stock_quantity, 0) AS stock_quantity
                 FROM product_variants pv
                 LEFT JOIN branch_stock bs ON bs.variant_id = pv.id AND bs.branch_id = ?
                 WHERE pv.product_id = ?`,
                [branch_id, id]
            );
        } else {
            variants = await db.query(
                `SELECT pv.*, COALESCE(total_stock.total, 0) AS stock_quantity
                 FROM product_variants pv
                 LEFT JOIN (
                     SELECT variant_id, SUM(stock_quantity) AS total
                     FROM branch_stock
                     GROUP BY variant_id
                 ) total_stock ON total_stock.variant_id = pv.id
                 WHERE pv.product_id = ?`,
                [id]
            );
        }

        res.json({ ...products[0], variants });
    } catch (err) {
        next(err);
    }
};

exports.createProduct = async (req, res, next) => {
    const { name, category, brand, description, variants } = req.body;

    if (!name || !category) {
        return res.status(400).json({ message: 'Name and category are required' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const result = await conn.query(
            'INSERT INTO products (name, category, brand, description) VALUES (?, ?, ?, ?)',
            [name, category, brand || null, description || null]
        );

        const productId = Number(result.insertId);

        if (variants && variants.length > 0) {
            // Get all active branches so we can create branch_stock entries
            const branches = await conn.query('SELECT id FROM branches WHERE is_active = TRUE');

            for (const v of variants) {
                const variantResult = await conn.query(
                    'INSERT INTO product_variants (product_id, size, color, cost_price, selling_price, sku) VALUES (?, ?, ?, ?, ?, ?)',
                    [productId, v.size, v.color, v.cost_price || 0, v.selling_price || 0, v.sku || null]
                );

                const variantId = Number(variantResult.insertId);

                // Create branch_stock for each active branch (default 0, or use provided stock)
                for (const branch of branches) {
                    await conn.query(
                        'INSERT INTO branch_stock (branch_id, variant_id, stock_quantity) VALUES (?, ?, ?)',
                        [Number(branch.id), variantId, v.stock_quantity || 0]
                    );
                }
            }
        }

        await conn.commit();
        res.status(201).json({ message: 'Product created', id: productId });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};

exports.updateProduct = async (req, res, next) => {
    const { id } = req.params;
    const { name, category, brand, description } = req.body;

    try {
        await db.query(
            'UPDATE products SET name = ?, category = ?, brand = ?, description = ? WHERE id = ?',
            [name, category, brand, description, id]
        );
        res.json({ message: 'Product updated' });
    } catch (err) {
        next(err);
    }
};

exports.deleteProduct = async (req, res, next) => {
    const { id } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Get all variant IDs for this product
        const variants = await conn.query('SELECT id FROM product_variants WHERE product_id = ?', [id]);
        const variantIds = variants.map(v => Number(v.id));

        if (variantIds.length > 0) {
            const placeholders = variantIds.map(() => '?').join(',');

            // Remove branch_stock entries
            await conn.query(`DELETE FROM branch_stock WHERE variant_id IN (${placeholders})`, variantIds);

            // Remove sale_items referencing these variants
            await conn.query(`DELETE FROM sale_items WHERE variant_id IN (${placeholders})`, variantIds);

            // Delete product variants
            await conn.query(`DELETE FROM product_variants WHERE id IN (${placeholders})`, variantIds);
        }

        // Delete the product
        await conn.query('DELETE FROM products WHERE id = ?', [id]);

        await conn.commit();
        res.json({ message: 'Product deleted' });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};

exports.addVariant = async (req, res, next) => {
    const { id } = req.params;
    const { size, color, cost_price, selling_price, sku } = req.body;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const result = await conn.query(
            'INSERT INTO product_variants (product_id, size, color, cost_price, selling_price, sku) VALUES (?, ?, ?, ?, ?, ?)',
            [id, size, color, cost_price || 0, selling_price || 0, sku || null]
        );

        const variantId = Number(result.insertId);

        // Create branch_stock entries for all active branches
        const branches = await conn.query('SELECT id FROM branches WHERE is_active = TRUE');
        for (const branch of branches) {
            await conn.query(
                'INSERT INTO branch_stock (branch_id, variant_id, stock_quantity) VALUES (?, ?, 0)',
                [Number(branch.id), variantId]
            );
        }

        await conn.commit();
        res.status(201).json({ message: 'Variant added', id: variantId });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};

exports.updateVariant = async (req, res, next) => {
    const { variantId } = req.params;
    const { size, color, cost_price, selling_price, sku } = req.body;

    try {
        await db.query(
            'UPDATE product_variants SET size = ?, color = ?, cost_price = ?, selling_price = ?, sku = ? WHERE id = ?',
            [size, color, cost_price, selling_price, sku, variantId]
        );
        res.json({ message: 'Variant updated' });
    } catch (err) {
        next(err);
    }
};

exports.getLowStock = async (req, res, next) => {
    const { branch_id } = req.query;

    try {
        let query;
        let params = [];

        if (branch_id) {
            query = `
                SELECT bs.stock_quantity, pv.id, pv.size, pv.color, pv.sku, pv.cost_price, pv.selling_price,
                       p.name AS product_name, p.category,
                       b.name AS branch_name, bs.branch_id
                FROM branch_stock bs
                JOIN product_variants pv ON pv.id = bs.variant_id
                JOIN products p ON p.id = pv.product_id
                JOIN branches b ON b.id = bs.branch_id
                WHERE bs.branch_id = ? AND bs.stock_quantity <= 5
                ORDER BY bs.stock_quantity ASC
            `;
            params = [branch_id];
        } else {
            query = `
                SELECT bs.stock_quantity, pv.id, pv.size, pv.color, pv.sku, pv.cost_price, pv.selling_price,
                       p.name AS product_name, p.category,
                       b.name AS branch_name, bs.branch_id
                FROM branch_stock bs
                JOIN product_variants pv ON pv.id = bs.variant_id
                JOIN products p ON p.id = pv.product_id
                JOIN branches b ON b.id = bs.branch_id
                WHERE bs.stock_quantity <= 5
                ORDER BY bs.stock_quantity ASC
            `;
        }

        const rows = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        next(err);
    }
};
