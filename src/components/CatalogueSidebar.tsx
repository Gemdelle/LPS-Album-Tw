import { NavLink } from "react-router-dom";

const CatalogueSidebar = () => {
    return (
        <aside className="catalogue-sidebar">
            <NavLink
                to="/"
                end
                className={({ isActive }) =>
                    `view-button catalogue-tab ${isActive ? "active-view-button" : ""}`
                }
            >
                <span>Adopt</span>
            </NavLink>
            <NavLink
                to="/leaderboard"
                className={({ isActive }) =>
                    `view-button leaderboard-tab ${isActive ? "active-view-button" : ""}`
                }
            >
                <span>Leaderboard</span>
            </NavLink>
        </aside>
    );
};

export default CatalogueSidebar;
