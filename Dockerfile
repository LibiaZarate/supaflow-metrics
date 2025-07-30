# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Instalar serve para servir archivos estáticos
RUN npm install -g serve

# Copiar los archivos construidos
COPY --from=builder /app/dist ./dist

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["serve", "-s", "dist", "-l", "3000"]
