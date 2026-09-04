// Vercel loads this generated server adapter as CommonJS.
const { createRequestHandler } = require('expo-server/adapter/vercel');
const path = require('node:path');

module.exports = createRequestHandler({
  build: path.join(process.cwd(), 'dist/server'),
  environment: process.env.NODE_ENV,
});
