const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../clothing-pos-backend/.env' });

async function resetSales() {
    console.log('Connecting to database...');
    
    // Connect using env vars from the backend or docker
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'rootpassword',
        database: process.env.DB_NAME || 'clothing_pos',
        port: process.env.DB_PORT || 3306,
    });

    try {
        console.log('Connected! Resetting sales and history data...');
        
        // Disable foreign key checks temporarily so we can truncate safely
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Truncate tables (this deletes all rows and resets the auto-increment ID to 1)
        await connection.query('TRUNCATE TABLE sale_items');
        console.log('Cleared sale_items table.');
        
        await connection.query('TRUNCATE TABLE sales');
        console.log('Cleared sales table.');
        
        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('Successfully deleted all sales and history! Your products and users are still intact.');
    } catch (e) {
        console.error('Error resetting sales data:', e);
    } finally {
        await connection.end();
    }
}

resetSales();
