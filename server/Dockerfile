# server/Dockerfile
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy only package files first (better layer caching)
COPY package*.json ./

# Install dependencies (this will install express, cors, redis, etc.)
RUN npm install

# Copy the rest of the source code
COPY . .

# Default command: run dev script (nodemon)
CMD ["npm", "run", "dev"]