import { normalizeKey } from "./filterUtils";

export type CatalogueFilters = {
    nameQuery: string;
    nameMode: number;
    nameWords: number;
    gifter: string;
    years: string[];
    colours: string[];
    specificId: string;
    minId: number;
    maxId: number;
    genders: string[];
    types: string[];
    animals: string[];
    breeds: string[];
    generations: string[];
    rarities: string[];
};

export const EMPTY_FILTERS: CatalogueFilters = {
    nameQuery: "",
    nameMode: 0,
    nameWords: 0,
    gifter: "",
    years: [],
    colours: [],
    specificId: "",
    minId: 0,
    maxId: 0,
    genders: [],
    types: [],
    animals: [],
    breeds: [],
    generations: [],
    rarities: [],
};

export function generationKey(value: unknown) {
    const raw = String(value ?? "").trim();
    if (!raw) {
        return "";
    }
    const match = raw.match(/(\d+)/);
    return match ? String(Number(match[1])) : raw.toUpperCase();
}

export function formatGeneration(value: unknown) {
    const key = generationKey(value);
    if (!key) {
        return "";
    }
    return /^\d+$/.test(key) ? `G${key}` : key;
}

function numericId(id: unknown) {
    const match = String(id ?? "").match(/\d+/);
    return match ? Number(match[0]) : NaN;
}

export function applyCatalogueFilters(data: any[], filters: CatalogueFilters) {
    const query = filters.nameQuery.trim().toLowerCase();
    const years = new Set(filters.years);
    const colours = new Set(filters.colours);
    const genders = new Set(filters.genders);
    const types = new Set(filters.types);
    const animals = new Set(filters.animals);
    const breeds = new Set(filters.breeds);
    const generations = new Set(filters.generations);
    const rarities = new Set(filters.rarities);

    return data.filter((pet) => {
        const name = String(pet.name || "");
        if (filters.nameMode === 1 && name === "") {
            return false;
        }
        if (filters.nameMode === 2 && name !== "") {
            return false;
        }
        if (filters.nameWords > 0 && (name === "" || name.split(" ").length !== filters.nameWords)) {
            return false;
        }
        if (query && !name.toLowerCase().includes(query)) {
            return false;
        }
        if (filters.gifter && normalizeKey(pet.gifter) !== filters.gifter) {
            return false;
        }
        if (years.size > 0 && !years.has(String(pet.birthday))) {
            return false;
        }
        if (colours.size > 0 && !colours.has(normalizeKey(pet.colour))) {
            return false;
        }
        if (filters.specificId && String(pet.id) !== String(filters.specificId).trim()) {
            return false;
        }
        const idNum = numericId(pet.id);
        if (filters.minId > 0 && !(idNum >= filters.minId)) {
            return false;
        }
        if (filters.maxId > 0 && !(idNum <= filters.maxId)) {
            return false;
        }
        if (genders.size > 0 && !genders.has(String(pet.gender || "").toUpperCase())) {
            return false;
        }
        if (types.size > 0 && !types.has(String(pet.type || "").toUpperCase())) {
            return false;
        }
        if (animals.size > 0 && !animals.has(normalizeKey(pet.animal))) {
            return false;
        }
        if (breeds.size > 0 && !breeds.has(normalizeKey(pet.breed))) {
            return false;
        }
        if (generations.size > 0 && !generations.has(generationKey(pet.generation))) {
            return false;
        }
        if (rarities.size > 0) {
            const rarity = Math.min(5, Math.max(0, Math.round(Number(pet.rarity) || 0)));
            if (!rarities.has(String(rarity))) {
                return false;
            }
        }
        return true;
    });
}
