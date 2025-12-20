FROM node:23-slim
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Set up for development
ENV NODE_ENV development
ENV NEXT_TELEMETRY_DISABLED 1

# Command to start development server
CMD ["npm", "run", "dev"]

# sudo docker compose down
# sudo docker compose build --no-cache
# sudo docker compose up
