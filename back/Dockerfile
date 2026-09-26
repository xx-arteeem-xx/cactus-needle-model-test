FROM node:22-alpine

WORKDIR /srv
ENV NODE_ENV=production

COPY back/package.json back/package-lock.json* ./
RUN npm install --omit=dev

COPY back/src ./src
COPY CHANGELOG.md ./CHANGELOG.md

EXPOSE 3000
CMD ["node", "src/server.js"]
