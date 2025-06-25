# ---- Build stage ------------------------------------------------------------
FROM node:20-alpine AS build

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the source
COPY . .

# If you have a build step (e.g., TypeScript, React SSR), run it here.
# RUN npm run build

# ---- Production stage -------------------------------------------------------
FROM node:20-alpine AS runtime

WORKDIR /app

# Environment
ENV NODE_ENV=production \
    PORT=3000

# Copy only the necessary files from the build stage
COPY --from=build /app .

# Use a non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -G appgroup -u 1001
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

CMD ["node", "server.js"] 