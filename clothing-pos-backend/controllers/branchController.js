const db = require('../config/db');

exports.getBranches = async (req, res, next) => {
    try {
        const rows = await db.query(
            'SELECT * FROM branches ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

exports.getBranchById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const rows = await db.query('SELECT * FROM branches WHERE id = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

exports.createBranch = async (req, res, next) => {
    const { name, address, phone } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Branch name is required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO branches (name, address, phone) VALUES (?, ?, ?)',
            [name, address || null, phone || null]
        );
        res.status(201).json({ message: 'Branch created', id: Number(result.insertId) });
    } catch (err) {
        next(err);
    }
};

exports.updateBranch = async (req, res, next) => {
    const { id } = req.params;
    const { name, address, phone, is_active } = req.body;

    try {
        await db.query(
            'UPDATE branches SET name = ?, address = ?, phone = ?, is_active = ? WHERE id = ?',
            [name, address, phone, is_active !== undefined ? is_active : true, id]
        );
        res.json({ message: 'Branch updated' });
    } catch (err) {
        next(err);
    }
};

exports.deleteBranch = async (req, res, next) => {
    const { id } = req.params;

    try {
        // Check if branch has any users or sales
        const users = await db.query('SELECT COUNT(*) AS count FROM users WHERE branch_id = ?', [id]);
        const sales = await db.query('SELECT COUNT(*) AS count FROM sales WHERE branch_id = ?', [id]);

        if (Number(users[0].count) > 0 || Number(sales[0].count) > 0) {
            return res.status(400).json({
                message: 'Cannot delete branch with assigned users or sales. Deactivate it instead.'
            });
        }

        await db.query('DELETE FROM branch_stock WHERE branch_id = ?', [id]);
        await db.query('DELETE FROM branches WHERE id = ?', [id]);
        res.json({ message: 'Branch deleted' });
    } catch (err) {
        next(err);
    }
};

// Update stock for a specific variant at a specific branch
exports.updateBranchStock = async (req, res, next) => {
    const { branchId, variantId } = req.params;
    const { stock_quantity } = req.body;

    if (stock_quantity === undefined || stock_quantity === null) {
        return res.status(400).json({ message: 'stock_quantity is required' });
    }

    try {
        // Upsert: insert or update
        await db.query(`
            INSERT INTO branch_stock (branch_id, variant_id, stock_quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE stock_quantity = ?
        `, [branchId, variantId, stock_quantity, stock_quantity]);

        res.json({ message: 'Branch stock updated' });
    } catch (err) {
        next(err);
    }
};

// Get stock for all variants at a specific branch (shows ALL variants, 0 if not stocked)
exports.getBranchStock = async (req, res, next) => {
    const { branchId } = req.params;

    try {
        const rows = await db.query(`
            SELECT pv.id AS variant_id, pv.size, pv.color, pv.sku, pv.cost_price, pv.selling_price,
                   p.name AS product_name, p.category, p.id AS product_id,
                   COALESCE(bs.stock_quantity, 0) AS stock_quantity
            FROM product_variants pv
            JOIN products p ON p.id = pv.product_id
            LEFT JOIN branch_stock bs ON bs.variant_id = pv.id AND bs.branch_id = ?
            ORDER BY p.name, pv.size
        `, [branchId]);

        res.json(rows);
    } catch (err) {
        next(err);
    }
};
