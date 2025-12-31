FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies (curl for healthcheck)
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install production dependencies
# 🛡️ Sovereign Security: Pure clean install
RUN npm ci --only=production

# Copy app source
COPY . .

# Expose port
EXPOSE 5000

# 🛡️ Sovereign Healthcheck
# Fails if /api/health does not return 200 OK within 3s
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["npm", "start"]
