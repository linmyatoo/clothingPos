const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../clothing-pos-backend/.env' }); // Try to load backend env if running locally

async function fixUrls() {
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
        console.log('Connected! Searching for broken MinIO image URLs...');
        const [products] = await connection.query('SELECT id, image_url FROM products WHERE image_url IS NOT NULL');
        
        // We will try to guess the public IP by asking the user, or if not provided, just replace 'minio' with 'localhost'
        const publicIp = process.argv[2] || 'localhost'; 
        console.log(`Using replacement host: ${publicIp} (Pass an IP as argument to use a different one, e.g. node fix-minio-urls.js 192.168.1.100)`);

        let updated = 0;
        for (const p of products) {
            if (p.image_url.includes('minio:9000') || p.image_url.includes('127.0.0.1:9000')) {
                let newUrl = p.image_url.replace(/http:\/\/(minio|127\.0\.0\.1):9000/, `http://${publicIp}:9000`);
                if (newUrl !== p.image_url) {
                    await connection.query('UPDATE products SET image_url = ? WHERE id = ?', [newUrl, p.id]);
                    updated++;
                }
            }
        }
        console.log(`Successfully updated ${updated} product image URLs!`);
    } catch (e) {
        console.error('Error fixing URLs:', e);
    } finally {
        await connection.end();
    }
}

fixUrls();
