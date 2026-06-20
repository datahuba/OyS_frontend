# Etapa 1: Construcción del build estático de React
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Resolver la desincronización del lockfile de forma limpia en producción
RUN npm install --legacy-peer-deps
COPY . .
# Argumentos de construcción requeridos para enlazar con la API de producción
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ARG REACT_APP_API_URL2
ENV REACT_APP_API_URL2=$REACT_APP_API_URL2
RUN npm run build

# Etapa 2: Servir con Nginx Alpine de producción
FROM nginx:1.25-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]