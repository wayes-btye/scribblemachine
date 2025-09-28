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

# Create missing symlinks for worker dependencies
RUN ln -sf .pnpm/dotenv@16.6.1/node_modules/dotenv node_modules/dotenv
RUN ln -sf .pnpm/uuid@9.0.1/node_modules/uuid node_modules/uuid
RUN ln -sf .pnpm/sharp@0.33.5/node_modules/sharp node_modules/sharp
RUN ln -sf .pnpm/pdfkit@0.14.0/node_modules/pdfkit node_modules/pdfkit
RUN ln -sf .pnpm/zod@3.25.76/node_modules/zod node_modules/zod

# Create Google AI symlinks
RUN mkdir -p node_modules/@google
RUN ln -sf ../.pnpm/@google+generative-ai@0.21.0/node_modules/@google/generative-ai node_modules/@google/generative-ai

# Create Supabase symlinks
RUN mkdir -p node_modules/@supabase
RUN ln -sf ../.pnpm/@supabase+supabase-js@2.57.4/node_modules/@supabase/supabase-js node_modules/@supabase/supabase-js

# Create workspace package symlinks
RUN mkdir -p node_modules/@coloringpage
RUN ln -sf ../../packages/config node_modules/@coloringpage/config
RUN ln -sf ../../packages/database node_modules/@coloringpage/database
RUN ln -sf ../../packages/types node_modules/@coloringpage/types

# Build stage
FROM base AS builder

# Copy source code (excluding node_modules to avoid symlink issues)
COPY packages/types/src ./packages/types/src
COPY packages/types/package.json ./packages/types/
COPY packages/types/tsconfig.json ./packages/types/
COPY packages/database/src ./packages/database/src
COPY packages/database/package.json ./packages/database/
COPY packages/database/tsconfig.json ./packages/database/
COPY packages/config/src ./packages/config/src
COPY packages/config/package.json ./packages/config/
COPY packages/config/tsconfig.json ./packages/config/
COPY services/worker/src ./services/worker/src
COPY services/worker/package.json ./services/worker/
COPY services/worker/tsconfig.json ./services/worker/
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

# Health check - verify process is running
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
  CMD pgrep -f "simple-worker.js" > /dev/null || exit 1

# Start the application
CMD ["node", "dist/simple-worker.js"]