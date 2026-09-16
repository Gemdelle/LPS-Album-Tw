import { useState } from "react";
import { formatGeneration } from "../services/catalogueFilters";
import { petImageSrc } from "../services/petImage";
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
};

const LEFT_STATS = [
    { label: "N°", key: "id" },
    { label: "Type", key: "type" },
    { label: "Animal", key: "animal" },
    { label: "Breed", key: "breed" },
];

const PetAdoptionRow = ({ pet, mode }: { pet: any; mode: "adopt" | "leaderboard" }) => {
    const [twitchName, setTwitchName] = useState("");
    const [code, setCode] = useState("");
    const isMale = String(pet.gender || "").trim().toUpperCase().startsWith("M");
    const generation = (formatGeneration(pet.generation) || "-").replace(/^G/, "");
    const rightStats = [
        { label: "Colour", value: pet.colour || "-" },
        { label: "Birthday", value: pet.birthday || "-" },
        { label: "Generation", value: generation },
        { label: "Gifter", value: pet.gifter || "-" },
    ];
    const adopter = String(pet.adopter || "").trim();

    const onAdopt = (event: React.FormEvent) => {
        event.preventDefault();
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

                {mode === "adopt" ? (
                    <form className="pet-adopt" onSubmit={onAdopt}>
                        <div className="pet-coin">
                            <span className="pet-coin-price">12000</span>
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
                        />
                        <input
                            className="pet-adopt-input"
                            type="text"
                            placeholder="enter code"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                        />
                        <button className="pet-adopt-btn" type="submit" aria-label="Adopt me">
                            <img src={ASSETS.adoptBtn} alt="ADOPT ME" />
                        </button>
                    </form>
                ) : (
                    <div className="pet-adopt">
                        <div className="pet-coin">
                            <span className="pet-coin-price">12000</span>
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
        </div>
    );
};

export default PetAdoptionRow;
