import cors from "cors";
import { env } from "../config/env.js";

const allowedOrigins = env.clientOrigin.split(",").map((origin) => origin.trim()).filter(Boolean);
const isLocalOrigin = (origin) => {
    try {
        const hostname = new URL(origin).hostname;
        return hostname === "localhost" || hostname === "127.0.0.1";
    } catch {
        return false;
    }
};

export const corsMiddleware = cors({
    origin(origin, callback) {
        if (!origin || env.clientOrigin === "*" || allowedOrigins.includes(origin)) return callback(null, true);
        if (env.nodeEnv !== "production" && isLocalOrigin(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
});
