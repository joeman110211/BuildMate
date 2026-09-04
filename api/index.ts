// Vercel loads this generated server adapter as CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createRequestHandler } = require('expo-server/adapter/vercel');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('node:path');

module.exports = createRequestHandler({
  build: path.join(__dirname, '../dist/server'),
  environment: process.env.NODE_ENV,
});
