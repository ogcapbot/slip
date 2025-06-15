# Use official Node 18 Alpine
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your app
COPY . .

EXPOSE 8080
CMD ["npm", "start"]
