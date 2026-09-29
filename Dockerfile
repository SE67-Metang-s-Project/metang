# Stage 1: Dependencies and generated Prisma client, shared by the build and migrate targets. The
# dependency layer comes before the source copy, so it is reused until package-lock.json changes.
FROM node:24-slim AS base
WORKDIR /app

# Prisma's schema engine (prisma migrate deploy, in the migrate target below) needs libssl. The
# runner image does not: the app talks to PostgreSQL through the pg driver adapter.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm cache clean --force
COPY . .

# The database addresses are placeholders: generating the client and building the pages do not
# connect. They are set on these commands only, not with ENV, so the migrate target below does not
# inherit them and reads the real DIRECT_URL or DATABASE_URL given to `docker run`.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
  DIRECT_URL=postgresql://build:build@localhost:5432/build \
  npx prisma generate

# Stage 2: Database migrations runner
FROM base AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

# Stage 3: Application build
FROM base AS build

ARG PUBLIC_SUBPATH=/metang
ENV PUBLIC_SUBPATH=$PUBLIC_SUBPATH
ENV NEXT_OUTPUT=standalone
ENV NEXT_TELEMETRY_DISABLED=1

RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
  DIRECT_URL=postgresql://build:build@localhost:5432/build \
  npx next build

# Stage 4: Production runner (must be last)
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

USER node

COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
