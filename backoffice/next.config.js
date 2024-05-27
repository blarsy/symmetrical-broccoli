/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    webpack: (
      config,
      { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
    ) => {
      config.module.rules.push({
        test: /\.svg$/,
        use: ["@svgr/webpack"]
      });
      return config
    }
}

module.exports = nextConfig
