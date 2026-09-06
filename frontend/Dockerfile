
FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --include=optional
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]