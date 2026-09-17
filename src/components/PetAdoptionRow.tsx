import { useState } from "react";
import { formatGeneration } from "../services/catalogueFilters";
import { petImageSrc } from "../services/petImage";
import { redeemAdoption, redeemErrorMessage } from "../services/adoptPet";
import genderF from "../assets/icons/F-gem.png";
import genderM from "../assets/icons/M-gem.png";
import squareFrame from "../assets/square-pet-frame.png";

const GIF_SRC = [
    `${process.env.PUBLIC_URL}/giphs/spadabeccia-1.gif`,
    `${process.env.PUBLIC_URL}/giphs/spadabeccia-2.gif`,
    `${process.env.PUBLIC_URL}/giphs/spadabeccia-3.gif`,
    `${process.env.PUBLIC_URL}/giphs/spadabeccia-4.gif`,
    `${process.env.PUBLIC_URL}/giphs/spadabeccia-5.gif`,
    `${process.env.PUBLIC_URL}/giphs/spadabeccia-6.gif`,
];

const ASSETS = {
    rowFrame: `${process.env.PUBLIC_URL}/Images/adoption/adoption-frame.png`,
    coin: `${process.env.PUBLIC_URL}/Images/adoption/coin.png`,
    adoptBtn: `${process.env.PUBLIC_URL}/Images/adoption/adopt-me-btn.png`,
    vDiv: `${process.env.PUBLIC_URL}/Images/adoption/division-vertical.png`,
    hDiv: `${process.env.PUBLIC_URL}/Images/adoption/division-horizontal.png`,
    rarityBar: `${process.env.PUBLIC_URL}/Images/rarity/rarity-bar.png`,
    rarityGem: (level: number) => `${process.env.PUBLIC_URL}/Images/rarity/rarity-${level}.png`,
};

function rarityLevel(value: unknown) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) {
        return 0;
    }
    return Math.min(5, Math.round(n));
}

const LEFT_STATS = [
    { label: "N°", key: "id" },
    { label: "Type", key: "type" },
    { label: "Animal", key: "animal" },
    { label: "Breed", key: "breed" },
];

const PetAdoptionRow = ({ pet, mode, onAdopted }: { pet: any; mode: "adopt" | "leaderboard"; onAdopted?: (id: string | number, twitchName: string) => void }) => {
    const [twitchName, setTwitchName] = useState("");
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const isMale = String(pet.gender || "").trim().toUpperCase().startsWith("M");
    const generation = (formatGeneration(pet.generation) || "-").replace(/^G/, "");
    const rightStats = [
        { label: "Colour", value: pet.colour || "-" },
        { label: "Birthday", value: pet.birthday || "-" },
        { label: "Generation", value: generation },
        { label: "Gifter", value: pet.gifter || "-" },
    ];
    const adopter = String(pet.adopter || "").trim();
    const price = pet.price === 0 || pet.price ? pet.price : "—";
    const rarity = rarityLevel(pet.rarity);

    const onAdopt = async (event?: React.FormEvent) => {
        event?.preventDefault();
        if (busy || adopter) {
            return;
        }
        if (!twitchName.trim()) {
            setMessage("Falta el nombre de Twitch.");
            return;
        }
        if (!code.trim()) {
            setMessage("Falta el código.");
            return;
        }
        setBusy(true);
        setMessage("Canjeando...");
        try {
            const result = await redeemAdoption({
                id: pet.id,
                twitchName,
                code
            });
            if (result.ok && (result.already || result.id || result.adopter)) {
                const name = result.adopter || twitchName.trim().replace(/^@/, "").toLowerCase();
                onAdopted?.(pet.id, name);
                setMessage(result.already ? "Ya estaba adoptado a tu nombre." : "¡Adoptado!");
                setCode("");
            } else {
                setMessage(redeemErrorMessage(result.error));
            }
        } catch {
            setMessage("No se pudo adoptar. Probá de nuevo.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className={`pet-row ${mode === "adopt" ? "pet-row-adopt" : ""}`}
            style={{ backgroundImage: `url(${ASSETS.rowFrame})` }}
        >
            <div className="pet-row-inner">
                <div className="pet-photo">
                    <div className="pet-photo-stage">
                        <img src={petImageSrc(pet.id)} alt="" loading="lazy" />
                        <div className="pet-photo-frame" style={{ backgroundImage: `url(${squareFrame})` }} />
                    </div>
                </div>

                <div className="pet-middle">
                    <div className="pet-title">
                        <span className="pet-title-name">{pet.name || "?"}</span>
                        <img
                            className="pet-title-gender"
                            src={isMale ? genderM : genderF}
                            alt={isMale ? "M" : "F"}
                        />
                    </div>
                    <img className="pet-hdiv" src={ASSETS.hDiv} alt="" />
                    <div className="pet-body">
                        <div className="pet-stats">
                            <div className="pet-stats-col">
                                {LEFT_STATS.map((stat) => (
                                    <span key={stat.key}>
                                        <strong>{stat.label}:</strong> <i>{pet[stat.key] || "-"}</i>
                                    </span>
                                ))}
                            </div>
                            <div className="pet-stats-col">
                                {rightStats.map((stat) => (
                                    <span key={stat.label}>
                                        <strong>{stat.label}:</strong> <i>{stat.value}</i>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="pet-gifs">
                            {GIF_SRC.map((src, index) => (
                                <div
                                    className={`pet-gif-slot ${mode === "adopt" ? "pet-gif-hidden" : ""}`}
                                    key={index}
                                >
                                    <span>!command</span>
                                    <div className="pet-gif-wrap">
                                        <img src={src} alt="" loading="lazy" />
                                        {mode === "adopt" ? <em>?</em> : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <img className="pet-vdiv pet-vdiv-adopt" src={ASSETS.vDiv} alt="" />

                <div className="pet-rarity-wrap">
                    <div className="pet-rarity" aria-label={`Rarity ${rarity || 0}`}>
                        <img className="pet-rarity-bar" src={ASSETS.rarityBar} alt="" />
                        <div className="pet-rarity-slots">
                            {[5, 4, 3, 2, 1].map((level) => (
                                <span className="pet-rarity-slot" key={level}>
                                    {rarity >= level ? (
                                        <img src={ASSETS.rarityGem(level)} alt="" />
                                    ) : null}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className={`pet-rarity-hero pet-rarity-hero--${rarity || 0}`}>
                        <span className="pet-rarity-hero-title">Rarity {rarity || "—"}</span>
                        {rarity > 0 ? (
                            <div className="pet-rarity-jewel">
                                <img src={ASSETS.rarityGem(rarity)} alt="" />
                                <em />
                                <i className="s1" />
                                <i className="s2" />
                                <i className="s3" />
                            </div>
                        ) : (
                            <span className="pet-rarity-hero-empty">—</span>
                        )}
                    </div>
                </div>

                {mode === "adopt" && !adopter ? (
                    <form className="pet-adopt" onSubmit={onAdopt}>
                        <div className="pet-coin">
                            <span className="pet-coin-price">{price}</span>
                            <img src={ASSETS.coin} alt="" />
                            <span className="pet-coin-help">
                                ?
                                <em>puntos acumulados del canal !points</em>
                            </span>
                        </div>
                        <input
                            className="pet-adopt-input"
                            type="text"
                            placeholder="enter your twitch name"
                            value={twitchName}
                            onChange={(event) => setTwitchName(event.target.value)}
                            disabled={busy}
                        />
                        <input
                            className="pet-adopt-input"
                            type="text"
                            placeholder="enter code"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            disabled={busy}
                        />
                        <button
                            className="pet-adopt-btn"
                            type="button"
                            aria-label="Adopt me"
                            disabled={busy}
                            onClick={() => void onAdopt()}
                        >
                            <img src={ASSETS.adoptBtn} alt="ADOPT ME" />
                        </button>
                    </form>
                ) : (
                    <div className="pet-adopt">
                        <div className="pet-coin">
                            <span className="pet-coin-price">{price}</span>
                            <img src={ASSETS.coin} alt="" />
                            <span className="pet-coin-help">
                                ?
                                <em>puntos acumulados del canal !points</em>
                            </span>
                        </div>
                        <div className="pet-owner">
                            <span className="pet-owner-label">OWNER</span>
                            <span className="pet-owner-name">{adopter || "—"}</span>
                        </div>
                    </div>
                )}
            </div>
            {message ? <div className="pet-adopt-banner">{message}</div> : null}
        </div>
    );
};

export default PetAdoptionRow;
