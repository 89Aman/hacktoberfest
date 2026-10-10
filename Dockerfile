# ==============================================================================
# Campus Rescue Landing Page - Production Nginx Dockerfile
# ==============================================================================
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom high-performance nginx server config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website assets to nginx webroot
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

# Expose HTTP port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx daemon in foreground
CMD ["nginx", "-g", "daemon off;"]
