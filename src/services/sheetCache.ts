import { mergePet } from "./petOverrides";
import type { PetPatch } from "./petOverrides";

const CACHE_KEY = "lps-sheet-cache-v2";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type SheetCache = {
    fetchedAt: number;
    data: any[];
};

export function loadSheetCache(): SheetCache | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw) as SheetCache;
        if (!Array.isArray(parsed.data) || typeof parsed.fetchedAt !== "number") {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function isCacheFresh(fetchedAt: number) {
    return Date.now() - fetchedAt < WEEK_MS;
}

export function saveSheetCache(data: any[], fetchedAt = Date.now()) {
    const payload: SheetCache = { fetchedAt, data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

export function patchSheetCache(id: string | number, patch: PetPatch) {
    const cache = loadSheetCache();
    if (!cache) {
        return;
    }
    saveSheetCache(mergePet(cache.data, id, patch), cache.fetchedAt);
}
