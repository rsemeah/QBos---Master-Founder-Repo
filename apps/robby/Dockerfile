FROM node:20-alpine

WORKDIR /app

# Set CI environment for pnpm
ENV CI=true

# Copy source
COPY . .

# Install npm dependencies with CI flag
RUN npm ci || npm install

EXPOSE 3000

# Start Robby CLI
CMD ["npm", "run", "robby"]
