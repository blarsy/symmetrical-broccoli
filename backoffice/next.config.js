/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: process.env.IMAGE_PATTERN_PROTOCOL,
          hostname: process.env.IMAGE_PATTERN_HOST,
          port: process.env.IMAGE_PATTERN_PORT,
          pathname: `/download/noco/${process.env.NEXT_PUBLIC_NOCO_PROJET_NAME}/ressources/images/**`
        }
      ],
    },
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
    },
}

module.exports = nextConfig
