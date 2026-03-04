/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'flowbite.com' },
      { hostname: 'cdn2.steamgriddb.com' },
      { hostname: 'store.steampowered.com' },
      { hostname: 'itch.io' },
      { hostname: 'imgproxy-staging.up.railway.app' },
      { hostname: 'images.igdb.com' },
      { hostname: 'image.tmdb.org' },
      { hostname: 'www.igdb.com' },
      { hostname: 'wikipedia.org' },
    ],
  },
}

module.exports = nextConfig
