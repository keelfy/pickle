/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { hostname: "flowbite.com" },
            { hostname: "cdn2.steamgriddb.com" },
            { hostname: "store.steampowered.com" },
            { hostname: "mrdrnose.itch.io" },
        ],
    },
    experimental: {
        ppr: true,
        dynamicIO: true,
    },
};

module.exports = nextConfig;
