import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      // Load the server entry module for SSR
      const { render } = await vite.ssrLoadModule("/src/entry-server.tsx");

      // Render the app HTML
      const { html: appHtml } = render(url);

      // Replace placeholder with rendered HTML
      const html = template
        .replace(`<!--app-html-->`, appHtml)
        .replace(
          `src="/src/entry-client.tsx"`,
          `src="/src/entry-client.tsx?v=${nanoid()}"`,
        );

      const page = await vite.transformIndexHtml(url, html);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export async function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "web");
  const ssrServerPath = path.resolve(import.meta.dirname, "server", "entry-server.js");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Check if SSR server bundle exists
  const hasSSR = fs.existsSync(ssrServerPath);

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res) => {
    const templatePath = path.resolve(distPath, "index.html");

    try {
      if (hasSSR) {
        // SSR mode: render the app on the server
        const template = await fs.promises.readFile(templatePath, "utf-8");

        // Import the server render function
        const { render } = await import(ssrServerPath);

        // Render the app HTML
        const { html: appHtml } = render(req.originalUrl);

        // Replace placeholder with rendered HTML
        const html = template.replace(`<!--app-html-->`, appHtml);

        res.status(200).set({ "Content-Type": "text/html" }).send(html);
      } else {
        // Fallback: serve static HTML (no SSR)
        res.sendFile(templatePath);
      }
    } catch (error) {
      console.error("SSR Error:", error);
      // Fallback to static file on error
      res.sendFile(templatePath);
    }
  });
}
