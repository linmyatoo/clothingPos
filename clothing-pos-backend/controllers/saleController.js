const db = require('../config/db');

const generateInvoice = () => {
    const timestamp = Date.now();
    const rand = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${rand}`;
};

exports.createSale = async (req, res, next) => {
    const { items, payment_method } = req.body;
    const sold_by = req.user.id;
    const branch_id = req.user.branch_id;

    if (!branch_id) {
        return res.status(400).json({ message: 'User is not assigned to any branch' });
    }

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items in cart' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        let totalAmount = 0;

        // Validate stock and calculate total (from branch_stock)
        for (const item of items) {
            const variants = await conn.query(
                `SELECT pv.*, bs.stock_quantity
                 FROM product_variants pv
                 JOIN branch_stock bs ON bs.variant_id = pv.id AND bs.branch_id = ?
                 WHERE pv.id = ?
                 FOR UPDATE`,
                [branch_id, item.variant_id]
            );

            if (!variants.length) {
                throw { status: 404, message: `Variant ${item.variant_id} not found at this branch` };
            }

            const variant = variants[0];

            if (variant.stock_quantity < item.quantity) {
                throw {
                    status: 400,
                    message: `Insufficient stock for variant ID ${item.variant_id}. Available: ${variant.stock_quantity}`,
                };
            }

            item.price = variant.selling_price;
            item.subtotal = variant.selling_price * item.quantity;
            totalAmount += Number(item.subtotal);
        }

        const invoice_number = generateInvoice();

        const saleResult = await conn.query(
            'INSERT INTO sales (invoice_number, total_amount, payment_method, sold_by, branch_id) VALUES (?, ?, ?, ?, ?)',
            [invoice_number, totalAmount, payment_method || 'cash', sold_by, branch_id]
        );

        const saleId = Number(saleResult.insertId);

        for (const item of items) {
            await conn.query(
                'INSERT INTO sale_items (sale_id, variant_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
                [saleId, item.variant_id, item.quantity, item.price, item.subtotal]
            );

            await conn.query(
                'UPDATE branch_stock SET stock_quantity = stock_quantity - ? WHERE branch_id = ? AND variant_id = ?',
                [item.quantity, branch_id, item.variant_id]
            );
        }

        await conn.commit();

        res.status(201).json({
            message: 'Sale created successfully',
            sale_id: saleId,
            invoice_number,
            total_amount: totalAmount,
        });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};

exports.getSales = async (req, res, next) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const { branch_id: filterBranch } = req.query;

        let query = `
      SELECT s.*, u.name AS cashier_name, b.name AS branch_name
      FROM sales s
      JOIN users u ON u.id = s.sold_by
      LEFT JOIN branches b ON b.id = s.branch_id
    `;
        const params = [];
        const conditions = [];

        if (!isAdmin) {
            // Employees only see their own branch sales
            conditions.push('s.branch_id = ?');
            params.push(req.user.branch_id);
        } else if (filterBranch) {
            // Admin can filter by branch
            conditions.push('s.branch_id = ?');
            params.push(filterBranch);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY s.created_at DESC';

        const rows = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

exports.getSaleById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const sales = await db.query(
            `SELECT s.*, u.name AS cashier_name, b.name AS branch_name
             FROM sales s
             JOIN users u ON u.id = s.sold_by
             LEFT JOIN branches b ON b.id = s.branch_id
             WHERE s.id = ?`,
            [id]
        );
        if (!sales.length) return res.status(404).json({ message: 'Sale not found' });

        const items = await db.query(`
      SELECT si.*, pv.size, pv.color, pv.sku, p.name AS product_name
      FROM sale_items si
      JOIN product_variants pv ON pv.id = si.variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE si.sale_id = ?
    `, [id]);

        res.json({ ...sales[0], items });
    } catch (err) {
        next(err);
    }
};
