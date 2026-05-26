FROM node:20-slim AS builder
WORKDIR /app

# Чтобы npm не выкидывал devDeps из-за NODE_ENV из Railway env
ENV NPM_CONFIG_PRODUCTION=false
ENV NODE_ENV=development

COPY package.json ./
COPY .npmrc ./
RUN npm install --include=dev --no-audit --no-fund

COPY . .
RUN ./node_modules/.bin/vite build

# --- Runtime stage ---
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/package.json ./
COPY --from=builder /app/.npmrc ./
RUN npm install --omit=dev --no-audit --no-fund

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

EXPOSE 3001
CMD ["node", "server/index.js"]
