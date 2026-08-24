FROM node:20.14.0-alpine3.20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

USER node

EXPOSE 5679

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5679/health || exit 1

CMD ["node", "app.js"]
