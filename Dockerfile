# Stage 1: Install dependencies and build the application. The dependency layer comes before the
# source copy, so it is reused until package-lock.json changes.
FROM node:24-slim AS build
WORKDIR /app

# Prisma's schema engine (prisma migrate deploy, in the migrate target below) needs libssl. The
# runner image does not: the app talks to PostgreSQL through the pg driver adapter.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .

ARG PUBLIC_SUBPATH=/metang
ENV PUBLIC_SUBPATH=$PUBLIC_SUBPATH
ENV NEXT_OUTPUT=standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DIRECT_URL=postgresql://build:build@localhost:5432/build

RUN npx prisma generate
RUN npx next build

# Stage 2: Database migrations runner
FROM build AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

# Stage 3: Production runner (must be last)
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
