import { MongoClient } from "mongodb";
import { env } from "./env.js";

export async function connectDatabase() {
    if (!env.mongoUri) {
        console.warn("Missing MONGODB_URI in environment. API will run in fallback mode.");
        return null;
    }

    const client = new MongoClient(env.mongoUri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 20000,
    });

    try {
        await client.connect();
        const collection = client.db(env.dbName).collection(env.collectionName);
        console.log(`Connected to MongoDB (${env.dbName}.${env.collectionName})`);
        return { client, collection };
    } catch (error) {
        await client.close().catch(() => { });
        console.warn(`Mongo unavailable (${error.message}). Using fallback dataset.`);
        return null;
    }
}
