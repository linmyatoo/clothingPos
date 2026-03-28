/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
// Strip trailing /api if present so rewrite destination works correctly
const apiBase = apiUrl.replace(/\/api\/?$/, '');

// For MinIO image proxying
let minioBase = process.env.NEXT_PUBLIC_MINIO_URL;
if (!minioBase) {
    if (apiBase.includes('localhost') || apiBase.includes('127.0.0.1')) {
        minioBase = apiBase.replace('5001', '9000');
    } else {
        // Extract the protocol and domain (e.g. https://cpos.duckdns.org) and append port 9000
        const match = apiBase.match(/^(https?):\/\/([^\/:]+)/);
        const protocol = match ? match[1] : 'http';
        const host = match ? match[2] : 'localhost';
        minioBase = `${protocol}://${host}:9000`;
    }
}

const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${apiBase}/api/:path*`,
            },
            {
                source: '/product-images/:path*',
                destination: `${minioBase}/product-images/:path*`,
            }
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
};

export default nextConfig;
