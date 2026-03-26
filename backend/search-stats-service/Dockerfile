FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3004

CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
