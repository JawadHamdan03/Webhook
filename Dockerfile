FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY src ./src

EXPOSE 5000

CMD ["npm", "run", "dev"]
