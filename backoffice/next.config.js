/** @type {import('next').NextConfig} */

const nextConfig = {
    experimental: {
      instrumentationHook: true
    },
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
}

module.exports = nextConfig
