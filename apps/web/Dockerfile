FROM oven/bun:1 AS base

# ---- dependencies ----
FROM base AS deps
WORKDIR /app

COPY bun.lock ./bun.lock ./
COPY apps/web/package.json ./package.json

RUN bun install

# ---- builder ----
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/. .

ARG NEXT_PUBLIC_DOMAIN
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_ORY_SDK_URL

ENV NEXT_PUBLIC_DOMAIN=$NEXT_PUBLIC_DOMAIN
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_ORY_SDK_URL=$NEXT_PUBLIC_ORY_SDK_URL

RUN bun run build

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]