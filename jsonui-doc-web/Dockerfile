# syntax=docker/dockerfile:1.7
#
# Build a static export of the docs site and serve it with nginx.
# This image is for production-style preview / CI verification — NOT dev hot-reload.
# For dev work, run `npm run dev` on the host (faster + no polling overhead).
#
# Build context must be the REPOSITORY ROOT (one level up from this Dockerfile),
# because prebuild scripts read /docs/, /tests/ etc. See docker-compose.yml.

FROM node:20-alpine AS builder

WORKDIR /repo

RUN apk add --no-cache libc6-compat

# Install deps first (cache-friendly)
COPY jsonui-doc-web/package.json jsonui-doc-web/package-lock.json* ./jsonui-doc-web/
WORKDIR /repo/jsonui-doc-web
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Bring in the rest of the repo (Dockerignore strips what we don't need)
WORKDIR /repo
COPY . .

WORKDIR /repo/jsonui-doc-web

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


FROM nginx:1.27-alpine AS runner

COPY --from=builder /repo/jsonui-doc-web/out /usr/share/nginx/html
COPY jsonui-doc-web/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
