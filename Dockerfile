# Use Node v22 (Alpine)
FROM node:22-alpine AS base

# Create and set app directory
WORKDIR /app

# Copy pnpm lockfile and package.json first for caching
COPY pnpm-lock.yaml ./
COPY package.json ./

# Install pnpm itself (alpine environment might need additional steps)
RUN apk add --no-cache curl \
  && npm install -g pnpm@latest

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm build

# Expose port 3000 for main branch
EXPOSE 3000

# Expose port 3001 for dev branch
EXPOSE 3001

# Stage for main branch deployment
FROM base AS main
CMD ["pnpm", "start"]

# Stage for dev branch deployment
FROM base AS dev
CMD ["pnpm", "dev"]
