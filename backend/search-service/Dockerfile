FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3004

# Remove 'db push' to prevent race condition table locks with salary-service on the 'salary' schema!
CMD ["npm", "start"]
