FROM node:20-alpine AS base

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S runner -u 1001

RUN npm install -g http-server

WORKDIR /app

COPY --chown=runner:nodejs ./web/ ./web
COPY ./web/ .

USER runner

EXPOSE 6001

ENV PORT 6001

CMD ["http-server", "-s -p 6001"]