# Use the official Node.js 22 image on Alpine for better-sqlite3 compatibility
FROM node:22-alpine

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++ gcc sqlite-dev

# Set working directory
WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install dependencies (use npm install to avoid lockfile mismatch issues)
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the frontend and bundle the backend
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application using npm start
CMD ["npm", "start"]

