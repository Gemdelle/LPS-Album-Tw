import '../styles/nav.css';
import { NavLink } from 'react-router-dom';
import NameFilter from "./NameFilter";
import YearsFilter from "./YearsFilter";
import ColoursFilter from "./ColoursFilter";
import IdFilter from "./IdFilter";
import GenderFilter from "./GenderFilter";
import TypesFilter from "./TypesFilter";
import AnimalFilter from "./AnimalFilter";
import BreedFilter from "./BreedFilter";
import GiftersFilter from "./GiftersFilter";
import GenerationFilter from "./GenerationFilter";
import RarityFilter from "./RarityFilter";

const Nav = ({ rawData, defaultData, filters, patchFilters, filteredCount, lastSheetSync, isRefreshingSheet, onRefreshSheet }: any) => {
    const totalAdopted = rawData.filter((data: any) => String(data.adopter || "").trim() !== "");
    const totalNotAdopted = rawData.filter((data: any) => String(data.adopter || "").trim() === "");

    return (
        <nav>
            <ul className="navholder">
                <li className='link'>
                    <NavLink style={{ textDecoration: 'none' }} to="/" className={({ isActive }) => `${isActive ? "active" : ""}`}>
                        <span>Adopt</span>
                    </NavLink>
                </li>
                <li className='link'>
                    <NavLink style={{ textDecoration: 'none' }} to="/guess-game"><span>Game</span></NavLink>
                </li>
                <li className='link'>
                    <NavLink style={{ textDecoration: 'none' }} to="/wishlist"><span>Wishlist</span></NavLink>
                </li>
            </ul>

            <div className='filter-container'>
                <NameFilter filters={filters} patchFilters={patchFilters} />
                <YearsFilter filters={filters} patchFilters={patchFilters} />
                <ColoursFilter filters={filters} patchFilters={patchFilters} />
                <IdFilter filters={filters} patchFilters={patchFilters} />
                <GenderFilter filters={filters} patchFilters={patchFilters} />
                <TypesFilter filters={filters} patchFilters={patchFilters} />
                <GenerationFilter filters={filters} patchFilters={patchFilters} defaultData={defaultData} />
                <AnimalFilter filters={filters} patchFilters={patchFilters} defaultData={defaultData} />
                <BreedFilter filters={filters} patchFilters={patchFilters} defaultData={defaultData} />
                <GiftersFilter filters={filters} patchFilters={patchFilters} defaultData={defaultData} />
                <RarityFilter filters={filters} patchFilters={patchFilters} />
                <div className="header-filter filter-result">
                    <label>Results</label>
                    <strong>{filteredCount ?? 0}</strong>
                </div>
            </div>

            <div className='stats-container'>
                <div className="header-totals">
                    <div className="header-total">
                        <strong>{rawData.length}</strong>
                        <span>Total</span>
                    </div>
                    <div className="header-total">
                        <i className="stat-icon stat-icon-named" />
                        <strong>{totalAdopted.length}</strong>
                        <span>Adopted</span>
                    </div>
                    <div className="header-total">
                        <i className="stat-icon stat-icon-not-named" />
                        <strong>{totalNotAdopted.length}</strong>
                        <span>Not adopted</span>
                    </div>
                </div>
                <div className="sheet-sync">
                    <span className="sheet-sync-time">
                        {lastSheetSync
                            ? `Última consulta: ${new Date(lastSheetSync).toLocaleString("es-AR")}`
                            : "Todavía no consultó la hoja"}
                    </span>
                    <button
                        type="button"
                        className="sheet-sync-button"
                        onClick={onRefreshSheet}
                        disabled={isRefreshingSheet}
                    >
                        {isRefreshingSheet ? "Consultando..." : "Actualizar"}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Nav;
