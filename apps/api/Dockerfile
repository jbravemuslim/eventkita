FROM mirror.gcr.io/library/node:24-alpine AS build
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY . .

RUN npm run build -w @eventkita/shared
RUN npm run db:generate -w @eventkita/api
RUN npm run build -w @eventkita/api

FROM mirror.gcr.io/library/node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/main.js"]
