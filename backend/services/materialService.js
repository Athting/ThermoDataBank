import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const fallbackPath = env.fallbackJsonPath ?? path.resolve(backendDir, "..", "..", "extracted_material_data", "_default_data_extracted.json");

const number = (value) => {
    if (value === null || value === undefined || String(value).trim() === "") return null;
    const match = String(value).match(/[+-]?\d*\.?\d+/);
    const parsed = match ? Number.parseFloat(match[0]) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : null;
};
const category = (name) => {
    const value = String(name ?? "").toLowerCase();
    if (value.includes("te")) return "Telluride";
    if (value.includes("se")) return "Selenide";
    if (value.includes("p")) return "Phosphide";
    return "Unknown";
};
const rowsFor = (rows, key) => Array.isArray(rows) ? rows.map((row) => ({ temperature_K: number(row?.temperature), value: number(row?.[key] ?? row?.value), unit: row?.unit ?? null })).filter((row) => Number.isFinite(row.value)) : [];

function buildDocuments(json) {
    const data = json?.extracted_data ?? {};
    const names = data?.material_composition?.materials ?? [];
    const grouped = new Map(names.map((name) => [String(name), { name: String(name), measurements: {}, temperature_data: [] }]));
    const sources = [
        ["seebeck", data?.seebeck_coefficient?.seebeck_data, "value_uV_per_K"],
        ["conductivity", data?.electrical_conductivity?.conductivity_data, "value_S_per_m"],
        ["thermal_conductivity", data?.thermal_conductivity?.thermal_conductivity_data, "value_W_per_mK"],
        ["power_factor", data?.power_factor?.power_factor_data, "value"],
        ["zt", data?.figure_of_merit_ZT?.zt_data, "zt_value"],
    ];
    for (const [name, rows, key] of sources) for (const row of rows ?? []) {
        const material = String(row?.material ?? "").trim();
        if (!material || number(row?.[key]) === null) continue;
        const target = grouped.get(material) ?? { name: material, measurements: {}, temperature_data: [] };
        grouped.set(material, target);
        const value = number(row[key]);
        const point = { temperature_K: number(row?.temperature), value, unit: row?.unit ?? null };
        if (!target.measurements[name]) target.measurements[name] = [];
        target.measurements[name].push(point);
        if (name === "zt" && Number.isFinite(point.temperature_K)) target.temperature_data.push({ temp: point.temperature_K, zt: value });
    }
    return [...grouped.values()].map((item) => {
        const representative = (key) => {
            const values = item.measurements[key] ?? [];
            const valid = values.filter((row) => Number.isFinite(row.value));
            valid.sort((a, b) => Math.abs((a.temperature_K ?? 300) - 300) - Math.abs((b.temperature_K ?? 300) - 300));
            return valid[0]?.value ?? 0;
        };
        return { _id: item.name, name: item.name, category: category(item.name), doi: json?.doi ?? null, source_status: json?.extraction_status ?? "fallback", seebeck: representative("seebeck"), conductivity: representative("conductivity"), thermal_conductivity: representative("thermal_conductivity"), zt: Math.max(0, ...(item.measurements.zt ?? []).map((row) => row.value)), temperature_data: item.temperature_data, measurements: item.measurements, created_at: new Date().toISOString() };
    });
}

export async function loadFallbackMaterials() {
    try {
        return buildDocuments(JSON.parse(await fs.readFile(fallbackPath, "utf8")));
    } catch (error) {
        console.warn(`Failed to load fallback JSON: ${error.message}`);
        return [];
    }
}

export function mapMaterial(doc, includeTemperatureData = false) {
    const id = String(doc._id ?? doc.id ?? doc.name ?? "unknown");
    const result = { id, name: doc.name ?? "Unknown", seebeck: Number(doc.seebeck ?? 0), conductivity: Number(doc.conductivity ?? 0), thermal_conductivity: Number(doc.thermal_conductivity ?? 0), zt: Number(doc.zt ?? 0), category: doc.category ?? "Unknown", doi: doc.doi ?? null, dois: Array.isArray(doc.dois) ? doc.dois : doc.doi ? [doc.doi] : [], source_status: doc.source_status ?? "unknown", created_at: doc.created_at ? new Date(doc.created_at).toISOString() : new Date().toISOString() };
    if (!includeTemperatureData) return result;
    return { ...result, temperature_data: (doc.temperature_data ?? []).map((point, index) => ({ id: String(point.id ?? `${id}-${index}`), material_id: id, temp: Number(point.temp ?? 0), zt: Number(point.zt ?? 0) })), measurements: doc.measurements ?? {} };
}

export function filterFallback(rows, { q, category: kind, minZt, maxZt, limit, skip }) {
    return rows.filter((row) => (!q || row.name.toLowerCase().includes(q.toLowerCase())) && (!kind || row.category === kind) && (!Number.isFinite(minZt) || row.zt >= minZt) && (!Number.isFinite(maxZt) || row.zt <= maxZt)).sort((a, b) => b.zt - a.zt || a.name.localeCompare(b.name)).slice(skip, skip + limit);
}
