# Build Stage
FROM node:22-alpine3.21 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

# Production Runtime Stage
FROM node:22-alpine3.21
WORKDIR /usr/src/app

# Upgrade base OS packages to patch known Alpine CVEs
RUN apk update && apk upgrade --no-cache && \
    rm -rf /var/cache/apk/* /usr/local/lib/node_modules/npm /opt/yarn* /usr/local/bin/corepack

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .

USER node
EXPOSE 5678

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5678/health || exit 1

CMD ["node", "app.js"]
