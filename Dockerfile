# --- Steg 1: Build-stadiet ---
# Vi använder en Node-image för att installera dependencies och bygga projektet
FROM node:18-alpine AS builder

# Sätt arbetskatalog
WORKDIR /app

# Definiera ARG för din API-URL (viktigt för GitHub Actions)
# Detta gör att variabeln kan tas emot under byggprocessen
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Kopiera paketfiler först för att utnyttja Dockers cache för lager
COPY package*.json ./
RUN npm install

# Kopiera resten av källkoden
COPY . .

# Bygg applikationen (skapar /dist eller /build mappen)
RUN npm run build

# --- Steg 2: Produktions-stadiet (Nginx) ---
# Här byter vi till en extremt lättviktig Nginx-image
FROM nginx:stable-alpine

# Kopiera de byggda filerna från builder-stadiet till Nginx webb-mapp
# OBS: Ändra /app/dist till /app/build om du använder Create React App
COPY --from=builder /app/dist /usr/share/nginx/html

# Lägg till en Nginx-konfiguration för att hantera "Client-side routing" (React Router)
# Detta gör att om du laddar om sidan på t.ex. /dashboard så skickas du inte till en 404-sida
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Exponera port 80 för trafik
EXPOSE 80

# Starta Nginx
CMD ["nginx", "-g", "daemon off;"]