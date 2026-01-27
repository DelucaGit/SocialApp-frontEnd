# Steg 1: Bygg-fasen
FROM node:18-alpine AS build
WORKDIR /app

# Ta emot variabeln från Koyeb under själva byggprocessen
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Steg 2: Produktions-fasen (Nginx server)
FROM nginx:stable-alpine
# Kopiera filerna från Vite-builden (dist) till Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Enkel Nginx-konfig för att hantera SPA-routing (viktigt!)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]