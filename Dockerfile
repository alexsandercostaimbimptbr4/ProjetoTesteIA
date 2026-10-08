# Production image for Easypanel (or any Docker host).
# Three stages: install dependencies, build, and a small runtime that carries
# only the standalone server.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Next.js inlines NEXT_PUBLIC_* variables into the bundle during the build, so
# they have to exist here and not only when the container starts. Easypanel
# passes the service's environment variables as build arguments.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
RUN test -n "$NEXT_PUBLIC_SUPABASE_URL" && test -n "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  || { echo "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY nas variaveis de ambiente do servico antes do build."; exit 1; }
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=true

COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Docker sets HOSTNAME to the container id; the server must listen on every
# interface for Easypanel's proxy to reach it.
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/.next/standalone ./
# public and .next/static are not part of the standalone output.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
# /login answers 200 without a session, so it shows the server is up.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/login > /dev/null || exit 1
CMD ["node", "server.js"]
