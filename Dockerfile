# Use official Node.js LTS image
FROM node:22-alpine

# Set working directory inside container
WORKDIR /app

# Copy only package files first for caching layer
COPY package*.json ./

# Install dependencies, skip dev + lifecycle scripts like "prepare"
RUN npm ci --omit=dev --ignore-scripts


# Copy the rest of the app
COPY . .

# Expose port (default Express port)
EXPOSE 3000

# Run the app
CMD ["node", "src/index.js"]
