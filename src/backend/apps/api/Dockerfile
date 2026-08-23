# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base

ARG PNPM_VERSION=11.18.0
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
WORKDIR /workspace

RUN corepack enable \
  && corepack install --global pnpm@${PNPM_VERSION}

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY src/backend/apps/api/package.json src/backend/apps/api/package.json

RUN pnpm install --frozen-lockfile --filter @food-recipes/api...

FROM dependencies AS build

ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/food_recipes
COPY src/backend/apps/api src/backend/apps/api

RUN pnpm --filter @food-recipes/api exec prisma generate --config prisma.config.ts
RUN pnpm --filter @food-recipes/api run build

FROM build AS migration

WORKDIR /workspace/src/backend/apps/api
CMD ["pnpm", "exec", "prisma", "migrate", "deploy", "--config", "prisma.config.ts"]

FROM build AS dev

ENV NODE_ENV=development
WORKDIR /workspace/src/backend/apps/api
CMD ["pnpm", "run", "start:dev"]

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /workspace/src/backend/apps/api

COPY --from=build /workspace/node_modules /workspace/node_modules
COPY --from=build /workspace/src/backend/apps/api/node_modules ./node_modules
COPY --from=build /workspace/src/backend/apps/api/dist ./dist
COPY --from=build /workspace/src/backend/apps/api/package.json ./package.json
COPY --from=build /workspace/src/backend/apps/api/prisma.config.ts ./prisma.config.ts
COPY --from=build /workspace/src/backend/apps/api/prisma ./prisma

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
