# Stage 1: Install dependencies
FROM node:24-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Stage 2: Build the application
FROM node:24-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG PUBLIC_SUBPATH=/metang
ENV PUBLIC_SUBPATH=$PUBLIC_SUBPATH
ENV NEXT_OUTPUT=standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DIRECT_URL=postgresql://build:build@localhost:5432/build

RUN npx prisma generate
RUN npx next build

# Stage 3: Database migrations runner
FROM build AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

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
