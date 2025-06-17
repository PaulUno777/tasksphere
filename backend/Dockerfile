FROM node:20-alpine AS base

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

FROM base AS development

COPY . .
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["yarn", "dev"]

FROM base AS build

COPY . .
RUN yarn build

FROM node:20-alpine AS production

WORKDIR /app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/database.sqlite

# Start the application
CMD ["yarn", "start"]