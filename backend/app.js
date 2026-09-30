import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { corsMiddleware } from "./middlewares/cors.js";
import materialRoutes from "./routes/materialRoutes.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendDist = path.join(projectRoot, "dist");

export function createApp({ collection = null, fallbackMaterials = [] } = {}) {
    const app = express();
    app.locals.collection = collection;
    app.locals.fallbackMaterials = fallbackMaterials;
    app.use(corsMiddleware);
    app.use(express.json());
    app.use("/api", materialRoutes);
    if (fs.existsSync(frontendDist)) {
        app.use(express.static(frontendDist));
        app.get("*", (_req, res) => res.sendFile(path.join(frontendDist, "index.html")));
    }
    app.use((error, _req, res, _next) => res.status(500).json({ error: error.message || "Internal server error" }));
    return app;
}
