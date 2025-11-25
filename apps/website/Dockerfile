# Production image for pre-built Next.js app
# NOTE: This Dockerfile expects the app to be built BEFORE running docker build
# Run: bun run build (from apps/website)
FROM oven/bun:1-alpine

LABEL org.opencontainers.image.source=https://github.com/parmazip/monobase
LABEL org.opencontainers.image.description="Monobase Website Application"

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy docker entrypoint script for runtime config
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Copy pre-built standalone output (preserves monorepo structure)
COPY .next/standalone ./

# Copy static files to correct monorepo path
COPY .next/static ./apps/website/.next/static

# Copy public folder to correct monorepo path
COPY public ./apps/website/public

# Set ownership for non-root user
RUN chown -R 1001:1001 /app && \
    chmod +x /docker-entrypoint.sh

USER nextjs

EXPOSE 3000

# Use entrypoint to set runtime env vars before starting server
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["bun", "apps/website/server.js"]
