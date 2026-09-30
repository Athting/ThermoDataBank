import { filterFallback, mapMaterial } from "../services/materialService.js";

const queryOptions = (query) => {
    const parsedLimit = Number.parseInt(String(query.limit ?? "200"), 10);
    const parsedSkip = Number.parseInt(String(query.skip ?? "0"), 10);
    return { q: typeof query.q === "string" ? query.q.trim() : "", category: typeof query.category === "string" ? query.category.trim() : "", minZt: Number.parseFloat(String(query.minZt ?? "")), maxZt: Number.parseFloat(String(query.maxZt ?? "")), limit: Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 500) : 200, skip: Number.isFinite(parsedSkip) ? Math.max(parsedSkip, 0) : 0 };
};
const source = (req) => req.app.locals.collection ?? req.app.locals.fallbackMaterials;
const findMany = async (req, filter, options = {}) => {
    if (req.app.locals.collection) return req.app.locals.collection.find(filter).sort({ zt: -1, name: 1 }).skip(options.skip ?? 0).limit(options.limit ?? 200).toArray();
    return filterFallback(source(req), { ...options, q: filter.q, category: filter.category, minZt: filter.minZt, maxZt: filter.maxZt });
};

export async function health(_req, res) { res.json({ ok: true }); }

export async function listMaterials(req, res) {
    try {
        const options = queryOptions(req.query);
        const filter = {};
        if (options.q) filter.q = options.q;
        if (options.category) filter.category = options.category;
        if (Number.isFinite(options.minZt)) filter.minZt = options.minZt;
        if (Number.isFinite(options.maxZt)) filter.maxZt = options.maxZt;
        const docs = await findMany(req, req.app.locals.collection ? { ...(options.q ? { name: { $regex: options.q, $options: "i" } } : {}), ...(options.category ? { category: options.category } : {}), ...((Number.isFinite(options.minZt) || Number.isFinite(options.maxZt)) ? { zt: { ...(Number.isFinite(options.minZt) ? { $gte: options.minZt } : {}), ...(Number.isFinite(options.maxZt) ? { $lte: options.maxZt } : {}) } } : {}) } : filter, options);
        res.json(docs.map((doc) => mapMaterial(doc, req.query.includeTemp === "true")));
    } catch (error) { res.status(500).json({ error: error.message || "Failed to fetch materials" }); }
}

export async function listNames(req, res) {
    try {
        const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
        const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? "50"), 10) || 50, 1), 500);
        if (req.app.locals.collection) {
            const docs = await req.app.locals.collection.find(q ? { name: { $regex: q, $options: "i" } } : {}, { projection: { name: 1 } }).sort({ name: 1 }).limit(limit).toArray();
            return res.json(docs.map((doc) => doc.name).filter(Boolean));
        }
        return res.json(source(req).map((doc) => doc.name).filter((name) => !q || name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.localeCompare(b)).slice(0, limit));
    } catch (error) { return res.status(500).json({ error: error.message || "Failed to fetch names" }); }
}

export async function listByNames(req, res) {
    try {
        const names = String(req.query.names ?? "").split(",").map((name) => name.trim()).filter(Boolean).slice(0, 20);
        if (!names.length) return res.json([]);
        const docs = req.app.locals.collection ? await req.app.locals.collection.find({ name: { $in: names } }).toArray() : source(req).filter((doc) => names.includes(doc.name));
        return res.json(docs.map((doc) => mapMaterial(doc, true)).sort((a, b) => names.indexOf(a.name) - names.indexOf(b.name)));
    } catch (error) { return res.status(500).json({ error: error.message || "Failed to fetch materials" }); }
}

export async function getMaterial(req, res) {
    try {
        const name = req.params.name;
        const doc = req.app.locals.collection ? await req.app.locals.collection.findOne({ name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } }) : source(req).find((item) => item.name.toLowerCase() === name.toLowerCase());
        if (!doc) return res.status(404).json({ error: "Material not found" });
        return res.json(mapMaterial(doc, true));
    } catch (error) {
        return res.status(500).json({ error: error.message || "Failed to fetch material" });
    }
}
