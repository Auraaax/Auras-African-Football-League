# AAFL Admin + Visitor Server
# Multi-stage build for smaller runtime image

FROM node:20-alpine AS deps
WORKDIR /app
# Only install server dependencies (we run server/server.js)
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production || npm install --production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy installed node_modules from deps stage
COPY --from=deps /app/server/node_modules /app/server/node_modules
# Copy source
COPY . .
# Expose app port (configurable via PORT)
ENV PORT=3002
EXPOSE 3002
# Default workdir to server
WORKDIR /app/server
# Start the server
CMD ["node", "server.js"]
