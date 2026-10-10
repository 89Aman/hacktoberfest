# ==============================================================================
# Campus Rescue Landing Page - Cloud Run & Containerized Production Dockerfile
# ==============================================================================
FROM nginx:alpine

# Cloud Run defaults to PORT=8080
ENV PORT=8080

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy high-performance nginx server config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website assets to nginx webroot
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

# Expose port 8080 for Google Cloud Run
EXPOSE 8080

# Dynamically substitute $PORT at runtime and launch nginx
CMD ["/bin/sh", "-c", "sed -i \"s/listen [0-9]*;/listen ${PORT};/g\" /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
