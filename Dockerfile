# syntax=docker/dockerfile:1

# --- deps ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# --- build ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG DATABASE_URL=postgresql://cursor:cursor@127.0.0.1:5432/notitendencias
ARG NEXT_PUBLIC_APP_URL=https://notitendencias.iareal.net
# Opcional en build: evita que Auth.js evalúe config vacía si el módulo se carga en build.
ARG AUTH_SECRET=
ARG AUTH_GOOGLE_ID=
ARG AUTH_GOOGLE_SECRET=
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV AUTH_SECRET=$AUTH_SECRET
ENV AUTH_GOOGLE_ID=$AUTH_GOOGLE_ID
ENV AUTH_GOOGLE_SECRET=$AUTH_GOOGLE_SECRET
ENV NEXT_TELEMETRY_DISABLED=1
# Heap moderado: 6 GB en VPS pequeños provoca OOM kill (exit 255) durante next build
ENV NODE_OPTIONS=--max-old-space-size=3072
RUN npm run build

# --- run ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3015
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3015
CMD ["node", "server.js"]
