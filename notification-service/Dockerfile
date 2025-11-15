FROM node:24.10-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application code
COPY src/ ./src/

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {r.on('data', () => {}); r.on('end', () => process.exit(r.statusCode === 200 ? 0 : 1))})"

# Start the application
CMD ["node", "src/index.js"]

