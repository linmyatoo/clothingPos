const Minio = require('minio');

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
});

const BUCKET = process.env.MINIO_BUCKET || 'product-images';

// Ensure the bucket exists on startup
const initBucket = async () => {
    try {
        const exists = await minioClient.bucketExists(BUCKET);
        if (!exists) {
            await minioClient.makeBucket(BUCKET);
            console.log(`MinIO bucket "${BUCKET}" created`);
        }

        // Set bucket policy to allow public read (so images can be served via URL)
        const policy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: '*',
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${BUCKET}/*`],
                },
            ],
        };
        await minioClient.setBucketPolicy(BUCKET, JSON.stringify(policy));
        console.log(`MinIO bucket "${BUCKET}" ready (public read)`);
    } catch (err) {
        console.error('MinIO init error:', err.message);
    }
};

module.exports = { minioClient, BUCKET, initBucket };
