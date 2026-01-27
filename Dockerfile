# Steg 1: Bygg-fasen
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Steg 2: Produktions-fasen (Servern)
FROM nginx:stable-alpine
# Kopiera de byggda filerna från steg 1 till Nginx standardmapp
COPY --from=build /app/dist /usr/share/nginx/html
# Kopiera en anpassad Nginx-konfig (valfritt men bra för React-routing)
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]