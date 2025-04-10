
# Use Node.js as the base image
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy .htaccess for non-Docker deployments
COPY public/.htaccess /usr/share/nginx/html/.htaccess

# Copy a simple PHP script to test database connectivity (useful for o2switch)
RUN echo '<?php phpinfo(); ?>' > /usr/share/nginx/html/info.php

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
