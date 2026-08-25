# 1. Build Stage
FROM node:22.14.0-alpine3.21 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

# 2. Production Stage
FROM node:22.14.0-alpine3.21
WORKDIR /usr/src/app

# Upgrade system packages to patch vulnerabilities
RUN apk update && apk upgrade --no-cache && \
    rm -rf /var/cache/apk/* /usr/local/lib/node_modules/npm /opt/yarn* /usr/local/bin/corepack

# Copy with explicit node ownership
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

USER node
EXPOSE 5678

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5678/health || exit 1

CMD ["node", "app.js"]
