// Vercel serverless function entry point
// This file is used by Vercel's Node.js runtime to serve API routes.

// In Vercel production, we need to use the built CJS output
// because Vercel's Node runtime doesn't natively handle TypeScript ESM imports.

let app;
try {
  const serverModule = require('../dist/server.cjs');
  app = serverModule.default || serverModule;
} catch (initError) {
  console.error('[Ya Kopi] Failed to initialize server module:', initError);
  // Export a fallback handler that returns JSON errors instead of Vercel HTML
  app = (req, res) => {
    res.status(500).json({
      error: 'Server backend gagal diinisialisasi. Silakan coba beberapa saat lagi atau hubungi IT Support.',
      details: process.env.NODE_ENV === 'development' ? initError.message : undefined
    });
  };
}

module.exports = app;