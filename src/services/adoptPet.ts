import { ADOPT_SCRIPT_URL } from "../data/adoptConfig";
import { fetchTwitchSheet } from "./twitchSheet";

export type RedeemResult = {
    ok: boolean;
    already?: boolean;
    id?: string;
    adopter?: string;
    error?: string;
    service?: string;
};

function sleep(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function nick(value: string) {
    return value.trim().replace(/^@/, "").toLowerCase();
}

function isRedeemPayload(json: RedeemResult | null) {
    return Boolean(json && typeof json.ok === "boolean" && json.service !== "lps-twitch-adopt" && json.error !== "use_post");
}

async function redeemByGet(payload: { id: string | number; twitchName: string; code: string }) {
    const query = new URLSearchParams({
        action: "redeem",
        id: String(payload.id),
        twitchName: payload.twitchName,
        code: payload.code
    });
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    try {
        const response = await fetch(`${ADOPT_SCRIPT_URL}?${query.toString()}`, {
            method: "GET",
            redirect: "follow",
            signal: controller.signal
        });
        return JSON.parse(await response.text()) as RedeemResult;
    } finally {
        window.clearTimeout(timer);
    }
}

export async function redeemAdoption(payload: {
    id: string | number;
    twitchName: string;
    code: string;
}): Promise<RedeemResult> {
    if (!ADOPT_SCRIPT_URL) {
        return { ok: false, error: "script_not_configured" };
    }

    try {
        const json = await redeemByGet(payload);
        if (isRedeemPayload(json)) {
            return json;
        }
    } catch {
        /* fallback: POST + hoja */
    }

    const body = JSON.stringify({
        action: "redeem",
        id: payload.id,
        twitchName: payload.twitchName,
        code: payload.code
    });
    void fetch(ADOPT_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body
    });

    const wanted = nick(payload.twitchName);
    const id = String(payload.id);
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
        await sleep(1000);
        try {
            const extra = (await fetchTwitchSheet())[id];
            if (extra?.adopter) {
                if (nick(extra.adopter) === wanted) {
                    return { ok: true, id, adopter: extra.adopter };
                }
                return { ok: false, error: "already_adopted" };
            }
        } catch {
            /* seguir */
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
            return "No se pudo confirmar. Revisá nick, código, y que el Apps Script esté publicado.";
        default:
            return "No se pudo adoptar. Probá de nuevo.";
    }
}
