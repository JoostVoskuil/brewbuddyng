FROM node:26-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --loglevel=error
COPY . .
RUN npm run build

FROM node:26-alpine
WORKDIR /app
COPY --from=builder /app/.output .output
COPY --from=builder /app/seed ./seed

RUN mkdir -p /data

ENV NUXT_DATABASE_PATH=/data/brewbuddy.db
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", ".output/server/index.mjs"]
