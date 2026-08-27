# Multi-stage build: install/build in a full node image, run in a slim one —
# the standalone output (see next.config.ts) means the runtime stage doesn't
# need node_modules or the source tree at all, just the traced server bundle.

FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# The generated client is gitignored and .dockerignored, so it has to be built
# here. Must run before `next build`, which imports it. Prisma 7 driver
# adapters mean this emits plain JavaScript with no platform-specific engine
# binary, so the image stays small and cold starts stay fast.
RUN npx prisma generate

RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
