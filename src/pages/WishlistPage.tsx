import "../styles/catalogue.css";
import { useEffect } from "react";

const WishlistPage = ({ setLocation }: any) => {
    useEffect(() => {
        setLocation("/wishlist");
    }, [setLocation]);

    return (
        <main className="catalogue-page">
            <div className="catalogue-list">
                <div className="leaderboard-placeholder">
                    <h1>Wishlist</h1>
                    <p>Acá van a ir los pets que los viewers pueden pedir.</p>
                </div>
            </div>
        </main>
    );
};

export default WishlistPage;
