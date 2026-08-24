# Stage 1: Build dependencies
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

# Stage 2: Production runtime image
FROM node:18-alpine
WORKDIR /app
USER node
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node app.js package.json ./

EXPOSE 5678
CMD ["node", "app.js"]
