FROM node:18-alpine AS base

RUN addgroup -g 1001 -S nodejs
RUN adduser -S webapi -u 1001

WORKDIR /app

RUN mkdir logs; chown -R webapi:nodejs logs;

RUN rm -rf webapi;mkdir webapi; chown -R webapi:nodejs webapi;
COPY --chown=webapi:nodejs ./webapi ./webapi

RUN apk add postgresql15-client
RUN chmod 705 /usr/bin/pg_dump

WORKDIR /app/webapi

USER webapi

RUN yarn

CMD ["yarn", "start"]