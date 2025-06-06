# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Create a non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/
COPY server.ts ./

# Build the application
RUN npm run build

# Production stage
FROM node:22-slim

WORKDIR /app

# Create a non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set proper permissions
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port
EXPOSE 3000

# Start the application based on NODE_ENV
CMD ["docker-entrypoint.sh"] 