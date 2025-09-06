# Resource Manager Service - Node.js Lambda Dockerfile
FROM public.ecr.aws/lambda/nodejs:18 AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --force --legacy-peer-deps --no-audit --no-fund

# Build sources
COPY src/ ./src/
COPY tsconfig.json ./
COPY lambda.config.json ./

# Build the application
RUN npm run build:lambda || npm run build

FROM public.ecr.aws/lambda/nodejs:18

# Copy bundled application from builder
COPY --from=builder /app/dist/index.js ${LAMBDA_TASK_ROOT}/index.js
COPY --from=builder /app/node_modules ${LAMBDA_TASK_ROOT}/node_modules
COPY --from=builder /app/lambda.config.json ${LAMBDA_TASK_ROOT}/

# Set the CMD to the handler
CMD ["index.handler"]
