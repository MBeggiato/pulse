FROM denoland/deno:alpine-2.0.6

# Install Docker CLI to monitor containers
RUN apk add --no-cache docker-cli

# Set working directory
WORKDIR /app

# Copy application files
COPY deno.json .
COPY *.ts .
COPY locales.json .
COPY config.example.json .

# Cache dependencies
RUN deno cache main.ts

# Create config directory for volume mount
RUN mkdir -p /app/config

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD deno eval "Deno.exit(0)"

# Run the application
CMD ["deno", "run", "--allow-read=/app", "--allow-run=docker", "--allow-net", "main.ts"]
