const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res, next) => {
    const password = req.body.password;
    const email = req.body.email?.trim().toLowerCase();

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const rows = await db.query(
            `SELECT u.*, b.name AS branch_name 
             FROM users u 
             LEFT JOIN branches b ON b.id = u.branch_id 
             WHERE u.email = ?`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: Number(user.id),
                name: user.name,
                email: user.email,
                role: user.role,
                branch_id: user.branch_id ? Number(user.branch_id) : null,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            token,
            user: {
                id: Number(user.id),
                name: user.name,
                email: user.email,
                role: user.role,
                branch_id: user.branch_id ? Number(user.branch_id) : null,
                branch_name: user.branch_name || null,
            },
        });
    } catch (err) {
        next(err);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const rows = await db.query(
            `SELECT u.id, u.name, u.email, u.role, u.branch_id, u.created_at,
                    b.name AS branch_name
             FROM users u
             LEFT JOIN branches b ON b.id = u.branch_id
             WHERE u.id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

exports.getEmployees = async (req, res, next) => {
    try {
        const rows = await db.query(
            `SELECT u.id, u.name, u.email, u.role, u.branch_id, u.created_at,
                    b.name AS branch_name
             FROM users u
             LEFT JOIN branches b ON b.id = u.branch_id
             ORDER BY u.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

exports.createEmployee = async (req, res, next) => {
    const { name, password, role, branch_id } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
    }

    try {
        const hashed = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (name, email, password, role, branch_id) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashed, role || 'employee', branch_id || null]
        );

        res.status(201).json({ message: 'User created', id: Number(result.insertId) });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email already exists' });
        }
        next(err);
    }
};

exports.updateEmployee = async (req, res, next) => {
    const { id } = req.params;
    const { name, email, role, branch_id, password } = req.body;

    try {
        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            await db.query(
                'UPDATE users SET name = ?, email = ?, role = ?, branch_id = ?, password = ? WHERE id = ?',
                [name, email, role, branch_id || null, hashed, id]
            );
        } else {
            await db.query(
                'UPDATE users SET name = ?, email = ?, role = ?, branch_id = ? WHERE id = ?',
                [name, email, role, branch_id || null, id]
            );
        }
        res.json({ message: 'User updated' });
    } catch (err) {
        next(err);
    }
};

exports.deleteEmployee = async (req, res, next) => {
    const { id } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Delete sale_items for sales made by this employee
        await conn.query('DELETE si FROM sale_items si INNER JOIN sales s ON si.sale_id = s.id WHERE s.sold_by = ?', [id]);

        // Delete sales made by this employee
        await conn.query('DELETE FROM sales WHERE sold_by = ?', [id]);

        // Delete the user
        await conn.query('DELETE FROM users WHERE id = ?', [id]);

        await conn.commit();
        res.json({ message: 'User deleted' });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};
