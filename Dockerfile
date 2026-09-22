# Multi-stage Dockerfile for CinePulse / Seat Booking Platform

# Stage 1: Build environment
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy workspace source files and compile both frontend & backend bundles
COPY . .
RUN npm run build

# Stage 2: Minimal Production Runtime
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime production dependencies
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy compiled static assets and bundled server from the builder stage
COPY --from=builder /app/dist ./dist

# Expose server ingress port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
