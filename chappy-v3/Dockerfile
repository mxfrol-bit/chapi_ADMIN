# ───────── Build stage ─────────
FROM node:22-slim AS builder
WORKDIR /app

ENV NPM_CONFIG_PRODUCTION=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_TIMEOUT=600000 \
    NODE_ENV=development

COPY package*.json ./
RUN npm install --include=dev --no-audit --no-fund

COPY . .
RUN ./node_modules/.bin/vite build

# ───────── Runtime stage ─────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NPM_CONFIG_PRODUCTION=true \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    PORT=3001

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

EXPOSE 3001
CMD ["node", "server/index.js"]
