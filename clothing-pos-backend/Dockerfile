# Use Node.js LTS (Alpine for smaller image size)
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5001

# Start the application
CMD ["npm", "start"]
