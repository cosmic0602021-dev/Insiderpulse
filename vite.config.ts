import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true, // Expose to external network (Replit)
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // Note: In development, Express (port 5000) integrates Vite as middleware
    // So we don't need proxy config here - API and frontend are on the same port
    allowedHosts: [
      // Extract hostname from FRONTEND_URL or APP_URL (for custom domains)
      ...(process.env.FRONTEND_URL || process.env.APP_URL
        ? [new URL(process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5000').hostname]
        : []
      ),
      // Replit dev domain (if exists)
      ...(process.env.REPLIT_DEV_DOMAIN ? [process.env.REPLIT_DEV_DOMAIN] : []),
      // Always allow localhost
      'localhost',
      '127.0.0.1'
    ].filter((host, index, self) => self.indexOf(host) === index), // Remove duplicates
  },
});
