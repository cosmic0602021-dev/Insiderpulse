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
      '0669bfcf-0b3b-4417-b2c9-15d7f4f47e57-00-39if825fwf2o8.worf.replit.dev',
      'localhost',
      '127.0.0.1'
    ],
  },
});
