/**
 * Package.json requirements for behavior tracking module
 * 
 * Add these to your main package.json:
 */

{
  "dependencies": {
    "socket.io": "^4.5.4",
    "@socket.io/redis-adapter": "^8.1.1",
    "redis": "^4.6.7",
    "ioredis": "^5.3.2",
    "geoip-lite": "^1.4.7",
    "uuid": "^9.0.0",
    "mongoose": "^7.5.0",
    "express": "^4.18.2",
    "express-jwt": "^8.4.1"
  },
  "devDependencies": {
    "socket.io-client": "^4.5.4"
  }
}

// ============================================
// INSTALLATION COMMANDS
// ============================================

// npm
npm install socket.io@^4.5.4 \
  @socket.io/redis-adapter@^8.1.1 \
  redis@^4.6.7 \
  ioredis@^5.3.2 \
  geoip-lite@^1.4.7 \
  uuid@^9.0.0

// yarn
yarn add socket.io@^4.5.4 \
  @socket.io/redis-adapter@^8.1.1 \
  redis@^4.6.7 \
  ioredis@^5.3.2 \
  geoip-lite@^1.4.7 \
  uuid@^9.0.0

// pnpm
pnpm add socket.io@^4.5.4 \
  @socket.io/redis-adapter@^8.1.1 \
  redis@^4.6.7 \
  ioredis@^5.3.2 \
  geoip-lite@^1.4.7 \
  uuid@^9.0.0
