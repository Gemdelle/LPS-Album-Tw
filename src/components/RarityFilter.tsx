const RARITIES = ["1", "2", "3", "4", "5"];

const RarityFilter = ({ filters, patchFilters }: any) => {
    return (
        <div className="header-filter">
            <label>Rarity</label>
            <select
                value={filters.rarities?.[0] || ""}
                onChange={(event) => patchFilters({ rarities: event.target.value ? [event.target.value] : [] })}
            >
                <option value="">All</option>
                {RARITIES.map((rarity) => (
                    <option key={rarity} value={rarity}>{rarity}</option>
                ))}
            </select>
        </div>
    );
};

export default RarityFilter;
