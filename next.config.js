/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { hostname: "flowbite.com" },
            { hostname: "cdn2.steamgriddb.com" },
            { hostname: "store.steampowered.com" },
            { hostname: "mrdrnose.itch.io" },
            { hostname: "imgproxy-staging.up.railway.app" },
        ],
    },
    experimental: {
        // ppr: true,
        // dynamicIO: true,
        typedRoutes: true,
    },
};

module.exports = nextConfig;
