// Vercel serverless function entry point
// This file is used by Vercel's Node.js runtime to serve API routes.

// In Vercel production, we need to use the built CJS output
// because Vercel's Node runtime doesn't natively handle TypeScript ESM imports.
const serverModule = require('../dist/server.cjs');
const app = serverModule.default || serverModule;

module.exports = app;