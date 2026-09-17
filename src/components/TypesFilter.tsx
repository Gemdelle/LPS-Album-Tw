import { normalizeKey, uniqueLabels } from "../services/filterUtils";

const TYPES = [
    { value: "NORMAL", label: "Normal" },
    { value: "HAIRY", label: "Hairy" },
    { value: "FUZZY", label: "Fuzzy" },
    { value: "EVENT", label: "Event" },
    { value: "POSTCARD", label: "Postcard" },
    { value: "SHINY", label: "Shiny" },
    { value: "GLITTER", label: "Glitter" },
    { value: "FAIRY", label: "Fairy" },
];

const TypesFilter = ({ filters, patchFilters, defaultData }: any) => {
    const known = new Set(TYPES.map((type) => type.value));
    const extraTypes = uniqueLabels((defaultData || []).map((pet: any) => pet.type))
        .filter(([key]) => key && !known.has(key));

    return (
        <div className="header-filter">
            <label>Type</label>
            <select
                value={filters.types[0] || ""}
                onChange={(event) => patchFilters({ types: event.target.value ? [event.target.value] : [] })}
            >
                <option value="">All</option>
                {TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                ))}
                {extraTypes.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                ))}
            </select>
        </div>
    );
};

export default TypesFilter;
