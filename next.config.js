/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { hostname: "flowbite.com" },
            { hostname: "cdn2.steamgriddb.com" },
        ],
    },
};

module.exports = nextConfig;
