# Production stage using Node.js to serve the pre-built Next.js app
# NOTE: This Dockerfile expects the app to be built BEFORE running docker build
# Run: bun run build (from apps/website)
FROM node:22-alpine

LABEL org.opencontainers.image.source=https://github.com/parmazip/monobase
LABEL org.opencontainers.image.description="Monobase Website Application"

# Create user with UID 101 to match K8s security context
RUN addgroup -g 101 -S nextjs-k8s && \
    adduser -u 101 -S -G nextjs-k8s nextjs-k8s

WORKDIR /app

# Copy the PRE-BUILT Next.js output
# IMPORTANT: Must run build before docker build (bun run build)
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

# Create necessary directories with proper permissions for non-root user
RUN mkdir -p /tmp && \
    chown -R 101:101 /app /tmp && \
    chmod -R 755 /app /tmp

# Set environment variables for runtime configuration
ENV PORT=8080
ENV NODE_ENV=production
ENV API_URL="http://localhost:7213"
ENV NEXT_TELEMETRY_DISABLED=1

# Switch to non-root user
USER 101:101

# Expose port (8080 for non-root)
EXPOSE 8080

# Start Next.js server
CMD ["node", "server.js"]
