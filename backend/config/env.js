import dotenv from "dotenv";

dotenv.config();

const parsePort = Number.parseInt(process.env.PORT ?? process.env.BACKEND_PORT ?? "4000", 10);

export const env = {
    port: Number.isFinite(parsePort) ? parsePort : 4000,
    mongoUri: process.env.MONGODB_URI ?? "",
    dbName: process.env.MONGODB_DB_NAME ?? "teg_dashboard",
    collectionName: process.env.MONGODB_COLLECTION ?? "materials",
    clientOrigin: process.env.CLIENT_ORIGIN ?? "*",
    nodeEnv: process.env.NODE_ENV ?? "development",
    fallbackJsonPath: process.env.FALLBACK_JSON_PATH,
};
