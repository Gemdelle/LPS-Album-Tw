const NamedFilter = ({ filters, patchFilters }: any) => {
    return (
        <div className="header-filter">
            <label>Named</label>
            <select
                value={String(filters.nameMode || 0)}
                onChange={(event) => patchFilters({ nameMode: Number(event.target.value) })}
            >
                <option value="0">All</option>
                <option value="1">Named</option>
                <option value="2">Not named</option>
            </select>
        </div>
    );
};

export default NamedFilter;
