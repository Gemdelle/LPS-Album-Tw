import "../styles/catalogue.css";
import CatalogueSidebar from "../components/CatalogueSidebar";
import PetAdoptionRow from "../components/PetAdoptionRow";
import { useEffect } from "react";

const LeaderboardPage = ({ setLocation, data }: any) => {
    useEffect(() => {
        setLocation("/leaderboard");
    }, [setLocation]);

    return (
        <main className="catalogue-page">
            <CatalogueSidebar />
            <div className="catalogue-list">
                {(data || []).map((petshop: any) => (
                    <PetAdoptionRow key={petshop.id} pet={petshop} mode="leaderboard" />
                ))}
            </div>
        </main>
    );
};

export default LeaderboardPage;
