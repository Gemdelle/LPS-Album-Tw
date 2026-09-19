import { normalizeKey } from "./filterUtils";

const GIF_COMMANDS = ["idle", "walk", "dance", "bomb", "fart", "victory"] as const;
const FALLBACK_FOLDER = "spadabeccia";

/** Animal del Excel (en mayúsculas) → carpeta en public/giphs. Agregá acá cuando haya un GIF de referencia. */
const ANIMAL_GIF_FOLDER: Record<string, string> = {
    FERRET: "gemdelline",
    CHINCHILLA: "spadabeccia",
};

function publicUrl(path: string) {
    return `${process.env.PUBLIC_URL}${path}`;
}

export function petGifSlug(pet: { name?: string } | null | undefined) {
    const raw = String(pet?.name || "").trim().toLowerCase();
    if (!raw) {
        return FALLBACK_FOLDER;
    }
    const hyphen = raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return hyphen || FALLBACK_FOLDER;
}

function folderKeysFromName(name: string) {
    const raw = String(name || "").trim().toLowerCase();
    if (!raw) {
        return [] as string[];
    }
    const hyphen = raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const compact = raw.replace(/[^a-z0-9]+/g, "");
    return Array.from(new Set([raw, hyphen, compact].filter(Boolean)));
}

function namedGifSrc(folder: string, index: number, command: string) {
    const n = index + 1;
    return publicUrl(`/giphs/${folder}/${folder}_${n}_${command}.gif`);
}

function pushFolderSources(sources: string[], folder: string, index: number, command: string) {
    const n = index + 1;
    sources.push(namedGifSrc(folder, index, command));
    sources.push(publicUrl(`/giphs/${folder}/${command}.gif`));
    sources.push(publicUrl(`/giphs/${folder}/${folder}-${n}.gif`));
    sources.push(publicUrl(`/giphs/${folder}/${folder}_${n}.gif`));
}

export function petGifSources(
    pet: { name?: string; animal?: string } | null | undefined,
    index: number,
    options?: { silhouette?: boolean }
) {
    const command = GIF_COMMANDS[index] || "idle";
    const animalFolder = ANIMAL_GIF_FOLDER[normalizeKey(pet?.animal)] || "";
    const nameFolders = folderKeysFromName(String(pet?.name || ""));
    const ordered = options?.silhouette
        ? [animalFolder, ...nameFolders, FALLBACK_FOLDER]
        : [...nameFolders, animalFolder, FALLBACK_FOLDER];
    const sources: string[] = [];
    Array.from(new Set(ordered.filter(Boolean))).forEach((folder) => {
        pushFolderSources(sources, folder, index, command);
    });
    return Array.from(new Set(sources));
}

export { GIF_COMMANDS, ANIMAL_GIF_FOLDER };
