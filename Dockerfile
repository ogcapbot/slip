# Use official Node 18 Alpine
FROM node:18-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your code
COPY . .

# Expose and run
EXPOSE 8080
CMD ["npm", "start"]
