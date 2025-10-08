FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy sources and build
COPY . .
RUN npm run build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app and node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
