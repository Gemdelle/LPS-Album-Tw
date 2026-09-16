import "../styles/card.css";
import {IPetshopData} from "../types/types";
import {useState} from "react";
import {isFavourite} from "../services/petOverrides";
import zoomNumberFrame from "../assets/frames/zoom-number-frame.png";
import { petImageSrc } from "../services/petImage";

interface ICardData {
    data: IPetshopData;
    handleUpdateField: (petshop: any, field: keyof IPetshopData, value: any) => Promise<void>;
    updatePet: (id: string | number, patch: Record<string, any>) => void;
    onOpenImage?: () => void;
}

const Card = ({
                  data,
                  handleUpdateField,
                  updatePet,
                  onOpenImage
              }: ICardData) => {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editableValue, setEditableValue] = useState<string>("");

    const handleEditClick = (field: keyof IPetshopData, value: string) => {
        setEditingField(field);
        setEditableValue(value);
    };

    const handleKeyPress = async (
        e: React.KeyboardEvent<HTMLInputElement>,
        field: keyof IPetshopData
    ) => {
        if (e.key === "Enter") {
            await handleUpdateField(data, field, editableValue);
            setEditingField(null);
        }
    };

    const renderEditableField = (field: keyof IPetshopData, value: string) => {
        return editingField === field ? (
            <input
                type="text"
                value={editableValue}
                onChange={(e) => setEditableValue(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, field)}
                onBlur={() => setEditingField(null)}
                autoFocus
            />
        ) : (
            <span onClick={() => handleEditClick(field, value)}>{value || "-"}</span>
        );
    };

    const isMale = String(data.gender || "").trim().toUpperCase().startsWith("M");

    const toggleFavourite = () => {
        updatePet(data.id, { favourite: isFavourite(data.favourite) ? "false" : "true" });
    };

    const toggleOwned = () => {
        updatePet(data.id, { status: data.status === "OWNED" ? "NOT_OWNED" : "OWNED" });
    };

    const toggleGender = () => {
        updatePet(data.id, { gender: isMale ? "F" : "M" });
    };

    return (
        <div
            className={`card-container ${isFavourite(data.favourite) ? "vip" : "basic"} ${data.status === "OWNED" ? "owned" : "not-owned"}`}>
            <div className="card-body">
                <div className="card-number">
                    <img className="card-number-frame" src={zoomNumberFrame} alt="" />
                    <span className="card-number-text">- {data.id} -</span>
                </div>

                <div className="card-hero">
                    <div
                        className="image-container"
                        onClick={onOpenImage}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if ((e.key === "Enter" || e.key === " ") && onOpenImage) {
                                e.preventDefault();
                                onOpenImage();
                            }
                        }}
                    >
                        <img
                            className="image"
                            src={petImageSrc(data.id)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                                e.currentTarget.style.visibility = "hidden";
                            }}
                        />
                    </div>
                </div>

                <div className="name-container">
                    <p className="name">{renderEditableField("name", data.name)}</p>
                </div>

                <div className="card-details">
                    <div className="data-container">
                        <span><strong><i>Type:</i></strong>{renderEditableField("type", data.type)}</span>
                        <span><strong><i>Animal:</i></strong>{renderEditableField("animal", data.animal)}</span>
                        <span><strong><i>Breed:</i></strong>{renderEditableField("breed", data.breed)}</span>
                        <span><strong><i>Colour:</i></strong>{renderEditableField("colour", data.colour)}</span>
                        <span><strong><i>Birthday:</i></strong>{renderEditableField("birthday", data.birthday)}</span>
                        <span><strong><i>Generation:</i></strong>{renderEditableField("generation", String(data.generation || ""))}</span>
                        <span><strong><i>Gifter:</i></strong>{renderEditableField("gifter", data.gifter)}</span>
                    </div>
                    <div className="card-actions">
                        <div
                            className={`owned-toggle ${data.status === "OWNED" ? "unlocked" : "locked"}`}
                            onClick={toggleOwned}
                            role="button"
                            aria-label="Owned"
                        />
                        <div
                            className={`like-toggle ${isFavourite(data.favourite) ? "liked" : "not-liked"}`}
                            onClick={toggleFavourite}
                            role="button"
                            aria-label="Like"
                        />
                        <div
                            className={`gender-toggle ${isMale ? "male" : "female"}`}
                            onClick={toggleGender}
                            role="button"
                            aria-label="Gender"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Card;
