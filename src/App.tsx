import { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/names.css';
import Nav from './components/Nav';
import NamesPage from './pages/NamesPage';
import CataloguePage from './pages/CataloguePage';
import LeaderboardPage from './pages/LeaderboardPage';
import WishlistPage from './pages/WishlistPage';
import GuessPage from './pages/GuessPage';
import ProtectedRoute from "./components/ProtectedRoute";
import localPetshops from './data/petshops_data.json';
import { applyOverrides, clearOverrides, mergePet, saveOverride } from './services/petOverrides';
import { applyCatalogueFilters, CatalogueFilters, EMPTY_FILTERS } from './services/catalogueFilters';
import { isCacheFresh, loadSheetCache, patchSheetCache, saveSheetCache } from './services/sheetCache';
import { parseCsv } from './services/parseCsv';
import { fetchTwitchSheet, mergeTwitchFields } from './services/twitchSheet';

// Spreadsheet público: https://docs.google.com/spreadsheets/d/1wo8iJYUg_1tjJbJ_RnFbSk-cHmMgV2s3MlmYcRvMACg
const SPREADSHEET_ID = '1wo8iJYUg_1tjJbJ_RnFbSk-cHmMgV2s3MlmYcRvMACg';
const SHEET_GID = '0';
const GOOGLE_SHEETS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
const GOOGLE_SHEETS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEdxi_rF3vMyu592vTSmjN3d2eelkSmL0QTr6gm5Aj5zergyjGHtVvSbrSXhHvCMyqcA/exec";

const SHEET_HEADERS = ["id", "name", "gender", "animal", "breed", "favourite", "colour", "type", "birthday", "gifter", "bloodline", "status", "generation", "season", "pre-evolution", "post-evolution", "wishlist-link", "base", "studied", "vip", "rarity"];

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

  const ownedData = useMemo(
    () => sourceData.filter((item: any) =>
      String(item.status || "").trim().toUpperCase() === "OWNED"
      && String(item.name || "").trim() !== ""
    ),
    [sourceData]
  );
  const availableToAdopt = useMemo(
    () => ownedData.filter((item: any) => String(item.adopter || "").trim() === ""),
    [ownedData]
  );
  const adoptedPets = useMemo(
    () => ownedData.filter((item: any) => String(item.adopter || "").trim() !== ""),
    [ownedData]
  );
  const catalogueData = useMemo(
    () => applyCatalogueFilters(availableToAdopt, filters),
    [availableToAdopt, filters]
  );
  const leaderboardData = useMemo(
    () => applyCatalogueFilters(adoptedPets, filters),
    [adoptedPets, filters]
  );
  const petShopData = ownedData;

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

            let twitchById = {} as Awaited<ReturnType<typeof fetchTwitchSheet>>;
            try {
                twitchById = await fetchTwitchSheet();
            } catch (twitchError) {
                console.warn("TWITCH sheet fetch failed:", twitchError);
            }

            const merged = mergeTwitchFields(data, twitchById);
            console.log("Fetched data:", merged.length, "pets from spreadsheet");
            saveSheetCache(merged);
            setLastSheetSync(Date.now());
            return merged;
        } catch (error) {
            const staleCache = loadSheetCache();
            if (staleCache?.data?.length) {
                console.warn(`Sheet fetch failed, using cached copy for ${SPREADSHEET_ID}:`, error);
                setLastSheetSync(staleCache.fetchedAt);
                return applyOverrides(staleCache.data);
            }
            console.warn(`Using local petshops data. Google Sheets fetch failed for ${SPREADSHEET_ID}:`, error);
            try {
                const twitchById = await fetchTwitchSheet();
                return mergeTwitchFields(applyOverrides(localPetshops as any[]), twitchById);
            } catch {
                return applyOverrides(localPetshops as any[]);
            }
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


  const markAdoptedLocal = (id: string | number, twitchName: string) => {
    const patch = { adopter: twitchName };
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
          try {
            const twitchById = await fetchTwitchSheet();
            setSourceData((prev) => mergeTwitchFields(prev, twitchById));
          } catch (twitchError) {
            console.warn("TWITCH sheet fetch failed:", twitchError);
          }
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
            <BrowserRouter basename={process.env.PUBLIC_URL === "." ? "" : process.env.PUBLIC_URL}>
              <Nav
                  rawData={ownedData}
                  defaultData={ownedData}
                  filters={filters}
                  patchFilters={patchFilters}
                  filteredCount={location === "/leaderboard" ? leaderboardData.length : catalogueData.length}
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
                          onAdopted={markAdoptedLocal}
                      />
                    }
                />
                <Route
                    path="/leaderboard"
                    element={
                      <LeaderboardPage setLocation={setLocation} data={leaderboardData} />
                    }
                />
                <Route
                    path="/wishlist"
                    element={<WishlistPage setLocation={setLocation} />}
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
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </div>
        </div>
      </div>
  );
}

export default App;