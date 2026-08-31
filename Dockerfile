# Use the official Node.js 20 image on Alpine for a lightweight, secure base
FROM node:20-alpine

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++ gcc sqlite-dev

# Set working directory
WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install all dependencies (including devDependencies so we can build the app)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the frontend and bundle the backend
RUN npm run build

# Expose port (Cloud Run routes to this port, we listen dynamically based on PORT env var)
EXPOSE 8080

# Start the application using npm start
CMD ["npm", "start"]
