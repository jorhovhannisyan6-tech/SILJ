FROM node:22-slim

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install ALL dependencies (needed for Vite build)
RUN npm install

# Copy application files (dist is ignored in .dockerignore)
COPY . .

# Build Vite frontend and compile server.ts to dist/server.cjs
RUN npm run build

# Cloud Run environment settings
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.cjs"]
