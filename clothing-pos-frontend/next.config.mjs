/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
// Strip trailing /api if present so rewrite destination works correctly
const apiBase = apiUrl.replace(/\/api\/?$/, '');

const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${apiBase}/api/:path*`,
            },
            {
                source: '/product-images/:path*',
                destination: `${apiBase.replace('5001', '9000')}/product-images/:path*`,
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
