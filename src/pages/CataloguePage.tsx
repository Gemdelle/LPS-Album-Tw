import "../styles/catalogue.css";
import { useState, useEffect } from "react";
import CatalogueSidebar from "../components/CatalogueSidebar";
import PetAdoptionRow from "../components/PetAdoptionRow";

const CataloguePage = ({ setLocation, data, onAdopted }: any) => {
    const [catalogueData, setCatalogueData] = useState(data);

    useEffect(() => {
        setLocation("/");
    }, [setLocation]);

    useEffect(() => {
        setCatalogueData(data);
    }, [data]);

    return (
        <main className="catalogue-page">
            <CatalogueSidebar />
            <div className="catalogue-list">
                {catalogueData.map((petshop: any) => (
                    <PetAdoptionRow key={petshop.id} pet={petshop} mode="adopt" onAdopted={onAdopted} />
                ))}
            </div>
        </main>
    );
};

export default CataloguePage;
