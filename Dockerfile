# Usa una imagen base de Node si es una app frontend
FROM node:18

# Crea el directorio de la app
WORKDIR /app

# Copia dependencias y código
COPY package*.json ./
RUN npm install
COPY . .

# Compila la app (si aplica)
RUN npm run build

# Expón el puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "preview"]
