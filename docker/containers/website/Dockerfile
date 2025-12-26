FROM node:20-alpine AS base

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

RUN mkdir logs; chown -R nextjs:nodejs logs;

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --chown=nextjs:nodejs ./website/public ./public
COPY --chown=nextjs:nodejs ./website/standalone ./
COPY --chown=nextjs:nodejs ./website/static ./.next/static
COPY --chown=nextjs:nodejs ./website/next.config.js ./

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]