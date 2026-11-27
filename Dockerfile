# ---- Étape 1 : dépendances de production ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# mkdir : garantit que node_modules existe même sans aucune dépendance
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
    && mkdir -p node_modules \
    && npm cache clean --force

# ---- Étape 2 : image finale minimale ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

# Mises à jour de sécurité Alpine
RUN apk upgrade --no-cache

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Exécution sans privilèges root
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
