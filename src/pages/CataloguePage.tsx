import '../styles/catalogue.css';
import { useState, useEffect } from "react";
import Card from "../components/Card";
import { IPetshopData } from '../types/types';
import { formatGeneration } from '../services/catalogueFilters';
import { isFavourite } from '../services/petOverrides';
import Footer from "../components/Footer";
import zoomNumberFrame from "../assets/frames/zoom-number-frame.png";
import zoomNameFrame from "../assets/frames/zoom-name-frame.png";
import { petImageSrc } from "../services/petImage";

const CataloguePage = ({ setLocation, data, updatePet }: any) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editableName, setEditableName] = useState<string>("");
    const [catalogueData, setCatalogueData] = useState(data);
    const [useCardView, setUseCardView] = useState(false);
    const [zoomedId, setZoomedId] = useState<string | number | null>(null);

    useEffect(() => {
        setLocation('/');
    }, [setLocation]);

    useEffect(() => {
        setCatalogueData(data);
    }, [data]);

    const zoomIndex = catalogueData.findIndex((pet: any) => String(pet.id) === String(zoomedId));
    const zoomedPet = zoomIndex >= 0 ? catalogueData[zoomIndex] : null;

    const stepZoom = (delta: number) => {
        if (catalogueData.length === 0) {
            return;
        }
        const current = zoomIndex >= 0 ? zoomIndex : 0;
        const next = (current + delta + catalogueData.length) % catalogueData.length;
        setZoomedId(catalogueData[next].id);
    };

    useEffect(() => {
        if (zoomedId == null) {
            return;
        }
        if (!catalogueData.some((pet: any) => String(pet.id) === String(zoomedId))) {
            setZoomedId(null);
        }
    }, [catalogueData, zoomedId]);

    useEffect(() => {
        if (zoomedId == null) {
            return;
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setZoomedId(null);
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                stepZoom(-1);
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                stepZoom(1);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [zoomedId, catalogueData, zoomIndex]);

    const handleNameClick = (petshop: any) => {
        setEditingId(petshop.id);
        setEditableName(petshop.name || "");
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditableName(e.target.value);
    };

    const handleUpdateField = async (petshop: any, field: keyof IPetshopData, value: any) => {
        updatePet(petshop.id, { [field]: value });
    };

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>, petshop: any) => {
        if (e.key === 'Enter') {
            await handleUpdateField(petshop, "name", editableName);
            setEditingId(null);
        }
    };

    const toggleStatus = (petshop: any) => {
        const newStatus = petshop.status === "OWNED" ? "NOT_OWNED" : "OWNED";
        updatePet(petshop.id, { status: newStatus });
    };

    const toggleFavourite = (petshop: any) => {
        updatePet(petshop.id, { favourite: isFavourite(petshop.favourite) ? "false" : "true" });
    };

    return (
        <main className="catalogue-page">
            <aside className="catalogue-sidebar">
                <button
                    type="button"
                    className={`view-button cards-tab ${useCardView ? 'active-view-button' : ''}`}
                    onClick={() => setUseCardView(true)}
                    aria-label="Cards"
                />
                <button
                    type="button"
                    className={`view-button catalogue-tab ${!useCardView ? 'active-view-button' : ''}`}
                    onClick={() => setUseCardView(false)}
                    aria-label="Catalogue"
                />
            </aside>

            <div className="catalogue-scroll">
            <div className="catalogue-grid">
            {catalogueData.map((petshop: any, index: any) => {
                const imageSrc = petImageSrc(petshop.id);

                return useCardView ? (
                    <Card
                        key={`${index}-${petshop.id}`}
                        data={petshop}
                        handleUpdateField={handleUpdateField}
                        updatePet={updatePet}
                        onOpenImage={() => setZoomedId(petshop.id)}
                    />
                ) : (
                    <div key={`${index}-${petshop.id}`}
                        className={`pet-container ${petshop.status === 'OWNED' ? 'owned' : 'not-owned'}`}>
                        <div className="pet-meta">
                            <div className={`status ${petshop.status === 'OWNED' ? 'unlocked' : 'locked'}`}
                                onClick={() => toggleStatus(petshop)}></div>
                            <span className="meta-line" aria-hidden="true"></span>
                            <div className="catalogue-number">
                                <i>{petshop.id}</i>
                            </div>
                            <span className="meta-line" aria-hidden="true"></span>
                            <div
                                className={`favourite-toggle ${isFavourite(petshop.favourite) ? 'liked' : 'not-liked'}`}
                                onClick={() => toggleFavourite(petshop)}
                            ></div>
                        </div>
                        {formatGeneration(petshop.generation) ? (
                            <span className="generation-tag">{formatGeneration(petshop.generation)}</span>
                        ) : null}
                        <div
                            className="pet-image-wrap"
                            onClick={() => setZoomedId(petshop.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setZoomedId(petshop.id);
                                }
                            }}
                        >
                            <img
                                src={imageSrc}
                                alt={`Petshop ${petshop.id}`}
                                className="petshop-img"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                    e.currentTarget.style.visibility = "hidden";
                                }}
                            />
                            <div className="pet-frame" aria-hidden="true"></div>
                        </div>
                        <div className="petshop-name">
                            {editingId === petshop.id ? (
                                <input
                                    type="text"
                                    value={editableName}
                                    onChange={handleNameChange}
                                    onKeyDown={(e) => handleKeyPress(e, petshop)}
                                    onBlur={() => setEditingId(null)}
                                    autoFocus
                                />
                            ) : (
                                <span
                                    className={petshop.name ? undefined : "unnamed-name"}
                                    onDoubleClick={() => handleNameClick(petshop)}
                                >
                                    {petshop.name || '?'}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
            </div>
            <Footer />
            </div>
            {zoomedPet ? (
                <div
                    className="pet-zoom-overlay"
                    onClick={() => setZoomedId(null)}
                    role="presentation"
                >
                    {catalogueData.length > 1 ? (
                        <button
                            type="button"
                            className="pet-zoom-arrow pet-zoom-prev"
                            aria-label="Previous pet"
                            onClick={(event) => {
                                event.stopPropagation();
                                stepZoom(-1);
                            }}
                        />
                    ) : null}
                    <div
                        className="pet-zoom-stage"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="pet-zoom-id">
                            <img className="pet-zoom-id-frame" src={zoomNumberFrame} alt="" />
                            <span className="pet-zoom-id-text">- {zoomedPet.id} -</span>
                        </div>
                        <div className="pet-zoom-wrap">
                            <img src={petImageSrc(zoomedPet.id)} alt={`Petshop ${zoomedPet.id}`} />
                            <div className="pet-frame" aria-hidden="true"></div>
                        </div>
                        <div className="pet-zoom-name">
                            <img className="pet-zoom-name-frame" src={zoomNameFrame} alt="" />
                            <span className={`pet-zoom-name-text ${zoomedPet.name ? "" : "unnamed-name"}`.trim()}>
                                {zoomedPet.name || "?"}
                            </span>
                        </div>
                    </div>
                    {catalogueData.length > 1 ? (
                        <button
                            type="button"
                            className="pet-zoom-arrow pet-zoom-next"
                            aria-label="Next pet"
                            onClick={(event) => {
                                event.stopPropagation();
                                stepZoom(1);
                            }}
                        />
                    ) : null}
                </div>
            ) : null}
        </main>
    );
};

export default CataloguePage;
