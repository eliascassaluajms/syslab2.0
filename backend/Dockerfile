FROM node:20-alpine
WORKDIR /src/app
COPY package*.json ./
RUN npm install
COPY . .
# Generar los tipos de Prisma antes de correr
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "run", "dev"]