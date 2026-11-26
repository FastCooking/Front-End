# --- Estágio 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Cache otimizado de dependências
COPY package*.json ./
RUN npm ci

# Copia código fonte
COPY . .

# Argumento e env para apontar as requisições API para o path do Nginx
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Estágio 2: Produção (Nginx) ---
FROM nginx:alpine

# Remove os arquivos padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos estáticos gerados no build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia a configuração do Nginx com suporte a SPA e proxy reverso
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]