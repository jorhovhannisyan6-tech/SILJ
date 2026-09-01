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

# Prune devDependencies to reduce image size (optional, but good)

# Cloud Run environment settings
ENV NODE_ENV=production
# We set PORT to 3000 to instruct Cloud Run (if it reads ENV) that we expect 3000

CMD ["node", "dist/server.cjs"]
