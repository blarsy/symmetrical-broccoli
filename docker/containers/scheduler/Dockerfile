FROM node:18-alpine AS base

RUN addgroup -g 1001 -S nodejs
RUN adduser -S scheduler -u 1001

WORKDIR /app

RUN rm -rf scheduler;mkdir scheduler; chown -R scheduler:nodejs scheduler;
COPY --chown=scheduler:nodejs ./scheduler ./scheduler

RUN apk add postgresql15-client
RUN chmod 705 /usr/bin/pg_dump

WORKDIR /app/scheduler

USER scheduler

RUN yarn

CMD ["yarn", "start"]

