FROM node:18-alpine AS base

RUN addgroup -g 1001 -S nodejs
RUN adduser -S scheduler -u 1001

WORKDIR /scheduler

RUN rm -rf jobs;mkdir jobs; chown -R scheduler:nodejs jobs;
COPY --chown=scheduler:nodejs ./scheduler/src ./jobs

RUN apk add postgresql15-client
RUN chmod 705 /usr/bin/pg_dump

WORKDIR /scheduler/jobs

USER scheduler

RUN yarn

CMD ["yarn", "start"]

