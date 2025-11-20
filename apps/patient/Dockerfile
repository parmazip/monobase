# Production stage using Caddy to serve the pre-built SPA
# NOTE: This Dockerfile expects the app to be built BEFORE running docker build
# Run: bun run build (from apps/patient)
FROM caddy:2.8-alpine

LABEL org.opencontainers.image.source=https://github.com/parmazip/monobase
LABEL org.opencontainers.image.description="Monobase Patient Application"

# Create user with UID 101 to match K8s security context
RUN addgroup -g 101 -S caddy-k8s && \
    adduser -u 101 -S -G caddy-k8s caddy-k8s

# Copy the PRE-BUILT dist folder to Caddy's default serve directory
# IMPORTANT: Must run build before docker build (bun run build)
COPY dist /srv

# Copy Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create necessary directories with proper permissions for non-root user
RUN mkdir -p /data /config /tmp && \
    chown -R 101:101 /data /config /tmp /srv && \
    chmod -R 755 /data /config /tmp /srv

# Ensure Caddy binary is executable by user 101 (critical for K8s security context)
RUN chown 101:101 /usr/bin/caddy && \
    chmod +x /usr/bin/caddy

# Set environment variables for runtime configuration
ENV PORT=8080
ENV API_URL="http://localhost:7213"
ENV ONESIGNAL_APP_ID=""
ENV XDG_DATA_HOME=/data
ENV XDG_CONFIG_HOME=/config

# Switch to non-root user
USER 101:101

# Expose port (8080 for non-root)
EXPOSE 8080

# Use entrypoint to generate config.json before starting Caddy
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
