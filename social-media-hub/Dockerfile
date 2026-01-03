# Production Dockerfile for Social Media Hub
FROM node:18-alpine

LABEL maintainer="Ultrarslanoglu <info@ultrarslanoglu.com>"
LABEL description="Ultrarslanoglu Social Media Hub - TikTok, Instagram, YouTube, X Integration Platform"

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm ci --only=production || npm install --production

# Copy application source
COPY . .

# Create necessary directories
RUN mkdir -p logs uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run with dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
