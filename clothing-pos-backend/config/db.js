const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
    socketPath: process.env.DB_SOCKET || '/tmp/mysql.sock',
    user: process.env.DB_USER || 'linmyatoo',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clothing_pos',
    connectionLimit: 10
});

// Test connection
pool.getConnection()
    .then(conn => {
        console.log('Connected to MariaDB successfully!');
        conn.release();
    })
    .catch(err => {
        console.error('Error connecting to MariaDB:', err);
    });

module.exports = pool;
