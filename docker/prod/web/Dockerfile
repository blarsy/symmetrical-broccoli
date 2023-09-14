FROM node:18-alpine AS base

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

RUN mkdir logs; chown -R nextjs:nodejs logs;

COPY --chown=nextjs:nodejs /public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --chown=nextjs:nodejs ./web/standalone ./
COPY --chown=nextjs:nodejs ./web/static ./.next/static
COPY --chown=nextjs:nodejs ./web/next.config.js ./
COPY --chown=nextjs:nodejs ./web/mailtemplates ./mailtemplates/

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]