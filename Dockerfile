FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Do not bake runtime secrets into the client/server bundle
ENV ADMIN_PASSWORD=
ENV SESSION_SECRET=
ENV SITE_URL=http://localhost:4321

RUN npm run db:seed && npm run build

FROM node:22-bookworm-slim
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/data ./data-init
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

RUN sed -i 's/\r$//' /app/docker-entrypoint.sh \
  && chmod +x /app/docker-entrypoint.sh \
  && mkdir -p /app/data /app/public/uploads

EXPOSE 4321
ENTRYPOINT ["/app/docker-entrypoint.sh"]
