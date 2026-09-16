import { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './styles/names.css';
import Nav from './components/Nav';
import NamesPage from './pages/NamesPage';
import CataloguePage from './pages/CataloguePage';
import GuessPage from './pages/GuessPage';
import ProtectedRoute from "./components/ProtectedRoute";
import localPetshops from './data/petshops_data.json';
import { applyOverrides, clearOverrides, mergePet, saveOverride } from './services/petOverrides';
import { applyCatalogueFilters, CatalogueFilters, EMPTY_FILTERS } from './services/catalogueFilters';
import { isCacheFresh, loadSheetCache, patchSheetCache, saveSheetCache } from './services/sheetCache';

// Spreadsheet público: https://docs.google.com/spreadsheets/d/1wo8iJYUg_1tjJbJ_RnFbSk-cHmMgV2s3MlmYcRvMACg
const SPREADSHEET_ID = '1wo8iJYUg_1tjJbJ_RnFbSk-cHmMgV2s3MlmYcRvMACg';
const SHEET_GID = '0';
const GOOGLE_SHEETS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
const GOOGLE_SHEETS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEdxi_rF3vMyu592vTSmjN3d2eelkSmL0QTr6gm5Aj5zergyjGHtVvSbrSXhHvCMyqcA/exec";

const SHEET_HEADERS = ["id", "name", "gender", "animal", "breed", "favourite", "colour", "type", "birthday", "gifter", "bloodline", "status", "generation", "season", "pre-evolution", "post-evolution", "wishlist-link", "base", "studied", "vip"];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (char === "\n") {
      row.push(cell.trim());
      if (row.some((value) => value !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
}

function normalizeSheetValue(header: string, value: string) {
  if (header === "favourite" || header === "studied" || header === "base") {
    const lower = value.toLowerCase();
    if (lower === "true" || lower === "false") {
      return lower;
    }
  }
  if (header === "gender") {
    const gender = value.trim().toUpperCase();
    if (gender.startsWith("M")) {
      return "M";
    }
    if (gender.startsWith("F")) {
      return "F";
    }
    return gender;
  }
  if (
    value !== "" &&
    !Number.isNaN(Number(value)) &&
    header !== "id" &&
    header !== "name" &&
    header !== "gender" &&
    header !== "animal" &&
    header !== "breed" &&
    header !== "colour" &&
    header !== "type" &&
    header !== "gifter"
  ) {
    return Number(value);
  }
  return value;
}


function App() {
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [filters, setFilters] = useState<CatalogueFilters>(EMPTY_FILTERS);
  const [location, setLocation] = useState("/");
  const [selectedPetShop, setSelectedPetShop] = useState({});
  const [guessGameProgress, setGuessGameProgress] = useState(0);
  const [starsAmount, setStarsAmount] = useState(0);
  const [lastSheetSync, setLastSheetSync] = useState<number | null>(null);
  const [isRefreshingSheet, setIsRefreshingSheet] = useState(false);
  const sourceDataRef = useRef<any[]>([]);
  sourceDataRef.current = sourceData;

  const catalogueData = useMemo(
    () => applyCatalogueFilters(sourceData, filters),
    [sourceData, filters]
  );
  const petShopData = useMemo(
    () => sourceData.filter((item: any) => item.status === "OWNED"),
    [sourceData]
  );

  const patchFilters = (partial: Partial<CatalogueFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  // 🔹 Función para obtener datos de Google Sheets (hoja pública)
    const fetchDataFromGoogleSheets = async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_CSV_URL, {
                method: "GET",
                redirect: "follow"
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const rows = parseCsv(await response.text());
            const actualHeaders = rows[0].map((header) => header.replace(/"/g, "").trim());
            const headerIndexes = SHEET_HEADERS.map((header) => {
                const aliases = header === "generation"
                    ? ["generation", "generacion", "generación", "gen"]
                    : header === "animal"
                        ? ["animal", "especie", "species"]
                        : header === "breed"
                            ? ["breed", "raza"]
                            : [header];
                return actualHeaders.findIndex((actual) =>
                    aliases.some((alias) => actual.toLowerCase() === alias.toLowerCase())
                );
            });

            if (headerIndexes[SHEET_HEADERS.indexOf("id")] === -1) {
                throw new Error("CSV format error: Missing id column.");
            }

            const data = rows.slice(1).map((row) => {
                const item = {} as any;
                SHEET_HEADERS.forEach((header, i) => {
                    const columnIndex = headerIndexes[i];
                    const raw = columnIndex === -1 ? "" : (row[columnIndex] || "").replace(/"/g, "").trim();
                    item[header] = columnIndex === -1 ? "" : normalizeSheetValue(header, raw);
                });
                return item;
            }).filter((item) => item.id !== "");

            if (data.length === 0) {
                throw new Error("Google Sheets returned no rows.");
            }

            console.log("Fetched data:", data.length, "pets from spreadsheet");
            saveSheetCache(data);
            setLastSheetSync(Date.now());
            return data;
        } catch (error) {
            const staleCache = loadSheetCache();
            if (staleCache?.data?.length) {
                console.warn(`Sheet fetch failed, using cached copy for ${SPREADSHEET_ID}:`, error);
                setLastSheetSync(staleCache.fetchedAt);
                return applyOverrides(staleCache.data);
            }
            console.warn(`Using local petshops data. Google Sheets fetch failed for ${SPREADSHEET_ID}:`, error);
            return applyOverrides(localPetshops as any[]);
        }
    };


  //
  const updateGoogleSheet = async (id: string | number, field: string, value: any) => {
    try {
      const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ id, field, value }),
        redirect: "follow"
      });

      if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.warn("Google Sheets update skipped:", error);
    }
  };

  const updatePet = (id: string | number, patch: Record<string, any>) => {
    Object.entries(patch).forEach(([field, value]) => {
      updateGoogleSheet(id, field, value);
    });
    saveOverride(id, patch);
    patchSheetCache(id, patch);
    setSourceData((prev) => mergePet(prev, id, patch));
  };


  // 🔹 Cargar datos al montar el componente
  const refreshFromSheet = async () => {
    setIsRefreshingSheet(true);
    try {
      clearOverrides();
      const data = await fetchDataFromGoogleSheets();
      if (data.length > 0) {
        setSourceData(applyOverrides(data));
      }
    } finally {
      setIsRefreshingSheet(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const cached = loadSheetCache();
      if (cached?.data?.length) {
        setSourceData(applyOverrides(cached.data));
        setLastSheetSync(cached.fetchedAt);
        if (isCacheFresh(cached.fetchedAt)) {
          return;
        }
      }

      const data = await fetchDataFromGoogleSheets();
      if (data.length > 0) {
        setSourceData(applyOverrides(data));
      }
    };
    loadData();
  }, []);
  

  // 🔹 Función para incrementar progreso del juego
  function incrementGameProgress() {
    let newProgress = guessGameProgress + 1;
    setGuessGameProgress(newProgress);
    if ([5, 10, 16].includes(newProgress)) {
      setStarsAmount(starsAmount + 1);
    }
  }

  function resetGuessGame() {
    setGuessGameProgress(0);
    setStarsAmount(0);
  }

  return (
      <div className="App">
        <div className="container">
          <div className="router">
            <HashRouter>
              <Nav
                  rawData={sourceData}
                  defaultData={sourceData}
                  filters={filters}
                  patchFilters={patchFilters}
                  filteredCount={catalogueData.length}
                  lastSheetSync={lastSheetSync}
                  isRefreshingSheet={isRefreshingSheet}
                  onRefreshSheet={refreshFromSheet}
              />
              <Routes>
                <Route
                    path="/"
                    element={
                      <CataloguePage
                          data={catalogueData}
                          setLocation={setLocation}
                          setSelectedPetShop={setSelectedPetShop}
                          selectedPetShop={selectedPetShop}
                          updateGoogleSheet={updateGoogleSheet}
                          refreshData={fetchDataFromGoogleSheets}
                          updatePet={updatePet}
                      />
                    }
                />
                <Route
                    path="/guess-game"
                    element={
                      <GuessPage
                          setLocation={setLocation}
                          defaultData={petShopData}
                          guessGameProgress={guessGameProgress}
                          incrementGameProgress={incrementGameProgress}
                          replay={resetGuessGame}
                          starsAmount={starsAmount}
                      />
                    }
                />
              <Route element={<ProtectedRoute />}>
                  <Route
                      path="/names"
                      element={
                          <NamesPage
                              data={petShopData}
                              setLocation={setLocation}
                              setSelectedPetShop={setSelectedPetShop}
                              selectedPetShop={selectedPetShop}
                          />
                      } />
              </Route>
              </Routes>
            </HashRouter>
          </div>
        </div>
      </div>
  );
}

export default App;