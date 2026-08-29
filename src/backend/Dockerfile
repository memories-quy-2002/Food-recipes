# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base

ARG PNPM_VERSION=11.18.0
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
WORKDIR /workspace

RUN corepack enable \
  && corepack install --global pnpm@${PNPM_VERSION}
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
COPY prisma.config.ts ./prisma.config.ts
COPY prisma/schema.prisma ./prisma/schema.prisma

RUN pnpm install --frozen-lockfile

FROM dependencies AS build

ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/food_recipes
COPY . .
WORKDIR /workspace

RUN pnpm exec prisma generate --config prisma.config.ts
RUN pnpm run build

FROM build AS migration

WORKDIR /workspace
CMD ["pnpm", "exec", "prisma", "migrate", "deploy", "--config", "prisma.config.ts"]

FROM build AS dev

ENV NODE_ENV=development
WORKDIR /workspace
CMD ["pnpm", "run", "start:dev"]

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /workspace

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/dist ./dist
COPY --from=build /workspace/package.json ./package.json
COPY --from=build /workspace/prisma.config.ts ./prisma.config.ts
COPY --from=build /workspace/prisma ./prisma

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
