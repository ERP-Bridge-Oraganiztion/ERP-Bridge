# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/next.config.js ./next.config.js

EXPOSE 8080

# Push the Prisma schema to the DB (creates tables if they don't exist yet),
# seed the two demo users, then start the server. Safe to run on every
# container start — db push and the seed's upserts are both idempotent.
CMD sh -c "npx prisma db push --skip-generate --accept-data-loss && npm run db:seed && npm run start"