/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { hostname: "flowbite.com" },
            { hostname: "cdn2.steamgriddb.com" },
            { hostname: "store.steampowered.com" },
            { hostname: "itch.io" },
        ],
    },
};

module.exports = nextConfig;
