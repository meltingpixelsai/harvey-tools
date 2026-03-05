FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends     ca-certificates     && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev
RUN npx playwright install --with-deps chromium

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

EXPOSE 8403

CMD ["node", "dist/index.js"]
