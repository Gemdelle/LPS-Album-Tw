import { ADOPT_SCRIPT_URL } from "../data/adoptConfig";
import { fetchTwitchSheet } from "./twitchSheet";

export type RedeemResult = {
    ok: boolean;
    already?: boolean;
    id?: string;
    adopter?: string;
    error?: string;
};

function sleep(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function nick(value: string) {
    return value.trim().replace(/^@/, "").toLowerCase();
}

export async function redeemAdoption(payload: {
    id: string | number;
    twitchName: string;
    code: string;
}): Promise<RedeemResult> {
    if (!ADOPT_SCRIPT_URL) {
        return { ok: false, error: "script_not_configured" };
    }

    const body = JSON.stringify({
        action: "redeem",
        id: payload.id,
        twitchName: payload.twitchName,
        code: payload.code
    });
    const post = {
        method: "POST" as const,
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body
    };

    void fetch(ADOPT_SCRIPT_URL, { ...post, mode: "no-cors" });

    try {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 8000);
        const response = await fetch(ADOPT_SCRIPT_URL, {
            ...post,
            redirect: "follow",
            signal: controller.signal
        });
        window.clearTimeout(timer);
        const json = JSON.parse(await response.text()) as RedeemResult & { service?: string };
        if (json && typeof json.ok === "boolean" && json.service !== "lps-twitch-adopt") {
            return json;
        }
    } catch {
        /* Google a veces come el POST; confirmamos en la hoja TWITCH. */
    }

    const wanted = nick(payload.twitchName);
    const id = String(payload.id);
    const deadline = Date.now() + 14000;
    while (Date.now() < deadline) {
        await sleep(1200);
        try {
            const map = await fetchTwitchSheet();
            const extra = map[id];
            if (extra?.adopter) {
                if (nick(extra.adopter) === wanted) {
                    return { ok: true, id, adopter: extra.adopter };
                }
                return { ok: false, error: "already_adopted" };
            }
        } catch {
            /* seguir intentando */
        }
    }
    return { ok: false, error: "timeout" };
}

export function redeemErrorMessage(error?: string) {
    switch (error) {
        case "script_not_configured":
            return "Falta configurar el script de adopción.";
        case "missing_code":
            return "Falta el código.";
        case "missing_twitch_name":
            return "Falta el nombre de Twitch.";
        case "invalid_code":
            return "Código inválido.";
        case "code_pet_mismatch":
            return "Ese código no es de este pet.";
        case "already_adopted":
            return "Este pet ya fue adoptado.";
        case "not_owned":
        case "not_named":
            return "Este pet no se puede adoptar.";
        case "timeout":
            return "No se confirmó en la hoja. Código mal, o falta republicar el Apps Script (Deploy → New version).";
        default:
            return "No se pudo adoptar. Probá de nuevo.";
    }
}
