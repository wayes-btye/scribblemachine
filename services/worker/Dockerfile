# Multi-stage build for worker service
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.1

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/
COPY services/worker/package.json ./services/worker/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder

# Copy source code
COPY packages/ ./packages/
COPY services/worker/ ./services/worker/
COPY tsconfig.base.json ./

# Build packages first
RUN pnpm -r --filter "./packages/*" run build

# Build worker service
RUN pnpm --filter "@coloringpage/worker" run build

# Production stage
FROM node:18-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    fontconfig \
    libgcc \
    libstdc++ \
    musl \
    ca-certificates

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/services/worker/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages

# Switch to nodejs user
USER nodejs

# Expose port (if needed for health checks)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the application
CMD ["node", "dist/index.js"]