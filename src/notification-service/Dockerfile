FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

USER node

EXPOSE 5679

CMD ["node", "app.js"]
