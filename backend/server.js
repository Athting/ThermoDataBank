import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { loadFallbackMaterials } from "./services/materialService.js";

async function start() {
    const database = await connectDatabase();
    const fallbackMaterials = database ? [] : await loadFallbackMaterials();
    if (!database) console.log(`Fallback materials loaded: ${fallbackMaterials.length}`);
    const app = createApp({ collection: database?.collection, fallbackMaterials });
    const server = app.listen(env.port, () => console.log(`API running at http://localhost:${env.port}`));
    const shutdown = async () => {
        server.close();
        await database?.client?.close();
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
}

start().catch((error) => {
    console.error(error);
    process.exit(1);
});
