import "../styles/card-as-row.css";
import { petImageSrc } from "../services/petImage";

interface ICardData {
    data: IPetshopData
}

interface IPetshopData{
    id: string
    name: string
    gender: string
    animal: string
    breed: string
    colour: string
    type: string
    bloodline: string
    birthday: string
    generation?: string | number
    clothes: string
    gifter: string
}

const CardAsRow = ({ data: {
    id,
    name,
    gender,
    animal,
    breed,
    colour,
    type,
    bloodline,
    birthday,
    generation,
    clothes,
    gifter
} }: ICardData) => {

    return (
        <div
            className={"card-as-row " + name ? "card" : "cardName"}
        >
            <div className="card-body">
                <div className="image-container">
                    <div className={name ? "portrait" : "portraitName"}></div>
                    <img className="image" src={petImageSrc(id)} alt="" />
                </div>

                <div className="name-container">
                    <p className="name">{name || "-"}</p>
                    <div className="id-container">
                        <p className="id">- {id} -</p>
                    </div>
                </div>

                <div className="data-container-01">
                    <span><strong><i>Gender: </i></strong><div className={gender === "F" ? "female" : "male"}></div></span>
                    <span><strong><i>Type: </i></strong>{type}</span>
                    <span><strong><i>Animal: </i></strong>{animal}</span>
                    <span><strong><i>Breed: </i></strong>{breed}</span>
                </div>

                <div className="data-container-02">
                    <span><strong><i>Colour: </i></strong>{colour}</span>
                    <span><strong><i>Clothes: </i></strong>{clothes}</span>
                    <span><strong><i>Birthday: </i></strong>{birthday}</span>
                    <span><strong><i>Generation: </i></strong>{generation || "-"}</span>
                    <span><strong><i>Gifter: </i></strong>{gifter}</span>
                </div>

                <div className="bloodline-wrap">
                    <div className="bloodline-container">
                        <div className={bloodline} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CardAsRow;
