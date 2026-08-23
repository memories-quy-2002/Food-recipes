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
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile --filter @food-recipes/api...

FROM dependencies AS build

ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/food_recipes
COPY apps/api apps/api
WORKDIR /workspace/apps/api

RUN pnpm exec prisma generate --config prisma.config.ts
RUN pnpm run build

FROM build AS migration

WORKDIR /workspace/apps/api
CMD ["pnpm", "exec", "prisma", "migrate", "deploy", "--config", "prisma.config.ts"]

FROM build AS dev

ENV NODE_ENV=development
WORKDIR /workspace/apps/api
CMD ["pnpm", "run", "start:dev"]

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /workspace

COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build /workspace/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=build /workspace/apps/api/prisma ./apps/api/prisma

WORKDIR /workspace/apps/api

USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
