import { parseCsv } from "./parseCsv";

export type TwitchPetFields = {
    adopter: string;
    price: string | number;
    rarity: string | number;
};

const SPREADSHEET_ID = "1wo8iJYUg_1tjJbJ_RnFbSk-cHmMgV2s3MlmYcRvMACg";
export const TWITCH_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=TWITCH`;

function headerIndex(headers: string[], names: string[]) {
    return headers.findIndex((header) => names.includes(header.toLowerCase()));
}

export function parseTwitchSheet(text: string) {
    const rows = parseCsv(text);
    if (rows.length < 2) {
        return {} as Record<string, TwitchPetFields>;
    }

    const headers = rows[0].map((header) => header.replace(/"/g, "").trim().toLowerCase());
    const idIdx = headerIndex(headers, ["id"]);
    const adopterIdx = headerIndex(headers, ["adopter"]);
    const priceIdx = headerIndex(headers, ["price"]);
    const rarityIdx = headerIndex(headers, ["rarity"]);

    if (idIdx === -1) {
        return {} as Record<string, TwitchPetFields>;
    }

    const byId: Record<string, TwitchPetFields> = {};
    rows.slice(1).forEach((row) => {
        const id = String(row[idIdx] || "").replace(/"/g, "").trim();
        if (!id) {
            return;
        }
        const adopter = adopterIdx === -1 ? "" : String(row[adopterIdx] || "").replace(/"/g, "").trim();
        const priceRaw = priceIdx === -1 ? "" : String(row[priceIdx] || "").replace(/"/g, "").trim();
        const price = priceRaw !== "" && !Number.isNaN(Number(priceRaw)) ? Number(priceRaw) : priceRaw;
        const rarityRaw = rarityIdx === -1 ? "" : String(row[rarityIdx] || "").replace(/"/g, "").trim();
        const rarity = rarityRaw !== "" && !Number.isNaN(Number(rarityRaw)) ? Number(rarityRaw) : rarityRaw;
        byId[id] = { adopter, price, rarity };
    });
    return byId;
}

export function mergeTwitchFields(pets: any[], twitchById: Record<string, TwitchPetFields>) {
    return pets.map((pet) => {
        const extra = twitchById[String(pet.id)] || { adopter: "", price: "", rarity: "" };
        const rarity = extra.rarity === 0 || extra.rarity ? extra.rarity : pet.rarity;
        return {
            ...pet,
            adopter: extra.adopter,
            price: extra.price,
            rarity,
        };
    });
}

export async function fetchTwitchSheet() {
    const response = await fetch(TWITCH_CSV_URL, { method: "GET", redirect: "follow" });
    if (!response.ok) {
        throw new Error(`TWITCH sheet error: ${response.status}`);
    }
    return parseTwitchSheet(await response.text());
}
