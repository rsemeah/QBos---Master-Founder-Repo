FROM node:20-alpine

WORKDIR /app

# Set CI environment
ENV CI=true

# Copy source
COPY . .

# Install dependencies
RUN npm ci || npm install

EXPOSE 3001

# Build TruthSerum
RUN npm run build || true

# Start TruthSerum verification
CMD ["npm", "run", "verify"]
