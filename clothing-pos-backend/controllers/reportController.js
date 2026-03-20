const db = require('../config/db');

// Helper to convert BigInt values to regular numbers in query results
const sanitizeRow = (row) => {
  const clean = {};
  for (const [key, val] of Object.entries(row)) {
    if (typeof val === 'bigint') {
      clean[key] = Number(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

const sanitizeRows = (rows) => rows.map(sanitizeRow);

// Build optional branch filter clause
const branchFilter = (queryParam, userBranchId, isAdmin) => {
  if (!isAdmin && userBranchId) {
    return { clause: 'AND s.branch_id = ?', param: userBranchId };
  }
  if (queryParam) {
    return { clause: 'AND s.branch_id = ?', param: queryParam };
  }
  return { clause: '', param: null };
};

exports.getDailySales = async (req, res, next) => {
  const { date, branch_id: filterBranch } = req.query;
  const now = new Date();
  const targetDate = date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isAdmin = req.user.role === 'admin';
  const bf = branchFilter(filterBranch, req.user.branch_id, isAdmin);

  try {
    const summaryRows = await db.query(`
      SELECT 
        COUNT(s.id) AS total_transactions,
        COALESCE(SUM(s.total_amount), 0) AS total_revenue,
        COALESCE(SUM((
          SELECT COALESCE(SUM(si.quantity * pv.cost_price), 0)
          FROM sale_items si
          JOIN product_variants pv ON pv.id = si.variant_id
          WHERE si.sale_id = s.id
        )), 0) AS total_cost,
        DATE(s.created_at) AS date
      FROM sales s
      WHERE DATE(s.created_at) = ? ${bf.clause}
      GROUP BY DATE(s.created_at)
    `, bf.param ? [targetDate, bf.param] : [targetDate]);

    const sales = await db.query(`
      SELECT s.*, u.name AS cashier_name, b.name AS branch_name
      FROM sales s
      JOIN users u ON u.id = s.sold_by
      LEFT JOIN branches b ON b.id = s.branch_id
      WHERE DATE(s.created_at) = ? ${bf.clause}
      ORDER BY s.created_at DESC
    `, bf.param ? [targetDate, bf.param] : [targetDate]);

    const summary = summaryRows.length > 0
      ? sanitizeRow(summaryRows[0])
      : { total_transactions: 0, total_revenue: 0, date: targetDate };

    res.json({
      summary,
      sales: sanitizeRows(sales),
    });
  } catch (err) {
    next(err);
  }
};

exports.getMonthlySales = async (req, res, next) => {
  const { year, month, branch_id: filterBranch } = req.query;
  const y = year || new Date().getFullYear();
  const m = month || new Date().getMonth() + 1;
  const isAdmin = req.user.role === 'admin';
  const bf = branchFilter(filterBranch, req.user.branch_id, isAdmin);

  try {
    const summaryRows = await db.query(`
      SELECT 
        COUNT(s.id) AS total_transactions,
        COALESCE(SUM(s.total_amount), 0) AS total_revenue,
        COALESCE(SUM((
          SELECT COALESCE(SUM(si.quantity * pv.cost_price), 0)
          FROM sale_items si
          JOIN product_variants pv ON pv.id = si.variant_id
          WHERE si.sale_id = s.id
        )), 0) AS total_cost,
        YEAR(s.created_at) AS year,
        MONTH(s.created_at) AS month
      FROM sales s
      WHERE YEAR(s.created_at) = ? AND MONTH(s.created_at) = ? ${bf.clause}
      GROUP BY YEAR(s.created_at), MONTH(s.created_at)
    `, bf.param ? [y, m, bf.param] : [y, m]);

    const daily = await db.query(`
      SELECT 
        DATE(s.created_at) AS date,
        COUNT(s.id) AS transactions,
        SUM(s.total_amount) AS revenue,
        COALESCE(SUM((
          SELECT COALESCE(SUM(si.quantity * pv.cost_price), 0)
          FROM sale_items si
          JOIN product_variants pv ON pv.id = si.variant_id
          WHERE si.sale_id = s.id
        )), 0) AS cost
      FROM sales s
      WHERE YEAR(s.created_at) = ? AND MONTH(s.created_at) = ? ${bf.clause}
      GROUP BY DATE(s.created_at)
      ORDER BY date ASC
    `, bf.param ? [y, m, bf.param] : [y, m]);

    const summary = summaryRows.length > 0
      ? sanitizeRow(summaryRows[0])
      : { total_transactions: 0, total_revenue: 0, year: y, month: m };

    res.json({
      summary,
      daily: sanitizeRows(daily),
    });
  } catch (err) {
    next(err);
  }
};

exports.getYearlySales = async (req, res, next) => {
  const { year, branch_id: filterBranch } = req.query;
  const y = year || new Date().getFullYear();
  const isAdmin = req.user.role === 'admin';
  const bf = branchFilter(filterBranch, req.user.branch_id, isAdmin);

  try {
    const summaryRows = await db.query(`
      SELECT 
        COUNT(s.id) AS total_transactions,
        COALESCE(SUM(s.total_amount), 0) AS total_revenue,
        COALESCE(SUM((
          SELECT COALESCE(SUM(si.quantity * pv.cost_price), 0)
          FROM sale_items si
          JOIN product_variants pv ON pv.id = si.variant_id
          WHERE si.sale_id = s.id
        )), 0) AS total_cost,
        YEAR(s.created_at) AS year
      FROM sales s
      WHERE YEAR(s.created_at) = ? ${bf.clause}
      GROUP BY YEAR(s.created_at)
    `, bf.param ? [y, bf.param] : [y]);

    const monthly = await db.query(`
      SELECT 
        MONTH(s.created_at) AS month,
        COUNT(s.id) AS transactions,
        SUM(s.total_amount) AS revenue,
        COALESCE(SUM((
          SELECT COALESCE(SUM(si.quantity * pv.cost_price), 0)
          FROM sale_items si
          JOIN product_variants pv ON pv.id = si.variant_id
          WHERE si.sale_id = s.id
        )), 0) AS cost
      FROM sales s
      WHERE YEAR(s.created_at) = ? ${bf.clause}
      GROUP BY MONTH(s.created_at)
      ORDER BY month ASC
    `, bf.param ? [y, bf.param] : [y]);

    const summary = summaryRows.length > 0
      ? sanitizeRow(summaryRows[0])
      : { total_transactions: 0, total_revenue: 0, year: y };

    res.json({
      summary,
      monthly: sanitizeRows(monthly),
    });
  } catch (err) {
    next(err);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const isAdmin = req.user.role === 'admin';
    const { branch_id: filterBranch } = req.query;
    const bf = branchFilter(filterBranch, req.user.branch_id, isAdmin);

    const todaySalesRows = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales s WHERE DATE(s.created_at) = ? ${bf.clause}`,
      bf.param ? [today, bf.param] : [today]
    );

    const monthSalesRows = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales s WHERE YEAR(s.created_at) = ? AND MONTH(s.created_at) = ? ${bf.clause}`,
      bf.param ? [currentYear, currentMonth, bf.param] : [currentYear, currentMonth]
    );

    // Low stock — branch-specific or across all branches
    let lowStockQuery;
    let lowStockParams = [];
    if (bf.param) {
      lowStockQuery = `
        SELECT bs.stock_quantity, pv.id, pv.size, pv.color, pv.sku,
               p.name AS product_name, b.name AS branch_name, bs.branch_id
        FROM branch_stock bs
        JOIN product_variants pv ON pv.id = bs.variant_id
        JOIN products p ON p.id = pv.product_id
        JOIN branches b ON b.id = bs.branch_id
        WHERE bs.branch_id = ? AND bs.stock_quantity <= 5
        ORDER BY bs.stock_quantity ASC
        LIMIT 10
      `;
      lowStockParams = [bf.param];
    } else {
      lowStockQuery = `
        SELECT bs.stock_quantity, pv.id, pv.size, pv.color, pv.sku,
               p.name AS product_name, b.name AS branch_name, bs.branch_id
        FROM branch_stock bs
        JOIN product_variants pv ON pv.id = bs.variant_id
        JOIN products p ON p.id = pv.product_id
        JOIN branches b ON b.id = bs.branch_id
        WHERE bs.stock_quantity <= 5
        ORDER BY bs.stock_quantity ASC
        LIMIT 10
      `;
    }

    const lowStock = await db.query(lowStockQuery, lowStockParams);

    const todayCountRows = await db.query(
      `SELECT COUNT(*) AS count FROM sales s WHERE DATE(s.created_at) = ? ${bf.clause}`,
      bf.param ? [today, bf.param] : [today]
    );

    res.json({
      today_revenue: Number(todaySalesRows[0]?.total || 0),
      monthly_revenue: Number(monthSalesRows[0]?.total || 0),
      today_transactions: Number(todayCountRows[0]?.count || 0),
      low_stock_items: sanitizeRows(lowStock),
    });
  } catch (err) {
    next(err);
  }
};

exports.getPerformance = async (req, res, next) => {
  const { branch_id: filterBranch } = req.query;
  const isAdmin = req.user.role === 'admin';
  const bf = branchFilter(filterBranch, req.user.branch_id, isAdmin);

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;

    let whereClause = `s.created_at >= '${dateStr}'`;
    let queryParams = [];
    if (bf.clause) {
      whereClause += ` ${bf.clause.replace('WHERE', 'AND')}`;
      queryParams.push(bf.param);
    }

    const performanceQuery = `
      SELECT 
        p.id, 
        p.name, 
        SUM(si.quantity) as total_sold
      FROM products p
      JOIN product_variants pv ON p.id = pv.product_id
      JOIN sale_items si ON pv.id = si.variant_id
      JOIN sales s ON si.sale_id = s.id
      WHERE ${whereClause}
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
    `;

    const rows = await db.query(performanceQuery, queryParams);

    const allProductsQuery = `SELECT id, name FROM products`;
    const allProducts = await db.query(allProductsQuery);

    const salesMap = {};
    rows.forEach(r => salesMap[r.id] = Number(r.total_sold));

    const allPerformance = allProducts.map(p => ({
      id: p.id,
      name: p.name,
      total_sold: salesMap[p.id] || 0
    })).sort((a, b) => b.total_sold - a.total_sold);

    const bestSelling = [];
    const normal = [];
    const lessSelling = [];

    const thresholdHigh = 20;
    const thresholdLow = 5;

    allPerformance.forEach((item, index) => {
      if (allPerformance.length > 0) {
        if (index < Math.max(3, Math.floor(allPerformance.length * 0.2)) && item.total_sold > 0) {
          bestSelling.push(item);
        } else if (item.total_sold === 0 || item.total_sold <= thresholdLow || index >= Math.floor(allPerformance.length * 0.7)) {
          lessSelling.push(item);
        } else {
          normal.push(item);
        }
      }
    });

    res.json({
      bestSelling: bestSelling.slice(0, 5),
      normal: normal.slice(0, 5),
      lessSelling: lessSelling.slice(0, 5)
    });
  } catch (err) {
    next(err);
  }
};
