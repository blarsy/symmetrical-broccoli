FROM node:18-alpine AS base

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

COPY --chown=nextjs:nodejs /public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --chown=nextjs:nodejs ./web/standalone ./
COPY --chown=nextjs:nodejs ./web/static ./.next/static
COPY --chown=nextjs:nodejs ./web/next.config.js ./

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]