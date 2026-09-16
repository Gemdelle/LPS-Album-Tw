import "../styles/card.css";
import {IPetshopData} from "../types/types";
import zoomNumberFrame from "../assets/frames/zoom-number-frame.png";
import { petImageSrc } from "../services/petImage";

interface ICardData {
    data: IPetshopData;
    onOpenImage?: () => void;
}

const Card = ({
                  data,
                  onOpenImage
              }: ICardData) => {
    const isMale = String(data.gender || "").trim().toUpperCase().startsWith("M");

    return (
        <div className="card-container basic owned">
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
                    <p className="name">{data.name || "-"}</p>
                </div>

                <div className="card-details">
                    <div className="data-container">
                        <span><strong><i>Type:</i></strong>{data.type || "-"}</span>
                        <span><strong><i>Animal:</i></strong>{data.animal || "-"}</span>
                        <span><strong><i>Breed:</i></strong>{data.breed || "-"}</span>
                        <span><strong><i>Colour:</i></strong>{data.colour || "-"}</span>
                        <span><strong><i>Birthday:</i></strong>{data.birthday || "-"}</span>
                        <span><strong><i>Generation:</i></strong>{String(data.generation || "") || "-"}</span>
                        <span><strong><i>Gifter:</i></strong>{data.gifter || "-"}</span>
                    </div>
                    <div className="card-actions">
                        <div
                            className={`gender-toggle ${isMale ? "male" : "female"}`}
                            aria-label="Gender"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Card;
