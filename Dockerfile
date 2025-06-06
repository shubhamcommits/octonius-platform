# Build stage
FROM node:23.11.0-alpine AS builder

WORKDIR /app

# Create a non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Install build dependencies
RUN apk add --no-cache python3 make g++

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
FROM node:23.11.0-alpine

WORKDIR /app

# Create a non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Install runtime dependencies
RUN apk add --no-cache postgresql-client

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy other necessary files
COPY .env ./

# Set proper permissions
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port
EXPOSE ${PORT}

# Start the application based on NODE_ENV
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
CMD ["docker-entrypoint.sh"] 