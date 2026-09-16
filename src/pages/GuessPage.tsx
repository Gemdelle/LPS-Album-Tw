import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/guess.css';
import Footer from "../components/Footer";
import { petImageSrc, firstPetId } from "../services/petImage";
import zoomNumberFrame from "../assets/frames/zoom-number-frame.png";
import barImg from "../assets/frames/bar-vertical.png";

const TOTAL_ROUNDS = 16;

function shuffle<T>(list: T[]) {
    return [...list].sort(() => Math.random() - 0.5);
}

function pickWrongNames(namedPetshops: any[], correctName: string, count: number) {
    const pool = shuffle(
        namedPetshops
            .map((pet: any) => pet.name)
            .filter((name: string) => name && name !== correctName)
    );
    const unique = Array.from(new Set(pool));
    while (unique.length < count && pool.length) {
        unique.push(pool[unique.length % pool.length]);
    }
    return unique.slice(0, count);
}

const FinishGame = ({ guessGameProgress, replay, setCurrentGuessIndex }: any) => {
    function resetGame() {
        setCurrentGuessIndex(0);
        replay();
    }

    return (
        <div className="finish-container">
            <p className="finish-title">Correct</p>
            <p className="finish-score">{guessGameProgress} / {TOTAL_ROUNDS}</p>
            <button type="button" className="replay-btn" onClick={resetGame}>
                <span>Replay</span>
            </button>
        </div>
    );
};

const GuessGame = ({
    selectedPetshop,
    answerRight,
    answerWrong,
    cheatsEnabled,
    correctCount,
}: any) => {
    const fillPercent = (correctCount / TOTAL_ROUNDS) * 100;
    const [starPop, setStarPop] = useState(false);
    const prevCorrect = useRef(correctCount);

    useEffect(() => {
        if (correctCount > prevCorrect.current) {
            setStarPop(false);
            const start = window.setTimeout(() => setStarPop(true), 20);
            const stop = window.setTimeout(() => setStarPop(false), 620);
            prevCorrect.current = correctCount;
            return () => {
                window.clearTimeout(start);
                window.clearTimeout(stop);
            };
        }
        prevCorrect.current = correctCount;
    }, [correctCount]);

    function selectedAnswer(answer: any) {
        if (selectedPetshop.correctAnswer === answer) {
            answerRight();
        } else {
            answerWrong();
        }
    }

    return (
        <div className="game-board">
            <div className="game-main">
                <section className="game-progress">
                    <div className="game-progress-frame">
                        <div className="game-bar-track">
                            <img className="game-bar-shell" src={barImg} alt="" />
                            <div
                                className="game-bar-fill"
                                style={{ clipPath: `inset(${100 - fillPercent}% 0 0 0)` }}
                            >
                                <img src={barImg} alt="" />
                            </div>
                            <div className="game-bar-icons">
                                {Array.from({ length: TOTAL_ROUNDS }, (_, index) => (
                                    <span
                                        key={index}
                                        className={`game-vip-mark ${index < correctCount ? "filled" : "empty"}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="game-pet">
                    <div className="game-score">
                        <p className="game-progress-label">Correct</p>
                        <p className="game-progress-score">{correctCount} / {TOTAL_ROUNDS}</p>
                        <span className="game-score-star">
                            <span className={`game-score-star-icon ${starPop ? "pop" : ""}`} />
                        </span>
                    </div>
                    <div className="game-pet-wrap">
                        <img src={selectedPetshop.image} alt="" />
                        <div className="pet-frame" aria-hidden="true"></div>
                    </div>
                    <div className="game-pet-number">
                        <img className="game-pet-number-frame" src={zoomNumberFrame} alt="" />
                        <span>- {selectedPetshop.displayId} -</span>
                    </div>
                </section>
            </div>

            <section className="game-options">
                <div className="game-options-list">
                    {selectedPetshop.answers.map((answer: string, index: number) => (
                        <button
                            type="button"
                            key={`${selectedPetshop.displayId}-${index}-${answer}`}
                            onClick={() => selectedAnswer(answer)}
                            className={cheatsEnabled && selectedPetshop.correctAnswer === answer ? "correct-answer" : ""}
                        >
                            <span className="game-option-frame" aria-hidden="true"></span>
                            <span className="game-option-text">{answer}</span>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
};

const GuessPage = ({ setLocation, defaultData, incrementGameProgress, guessGameProgress, replay }: any) => {
    const namedPetshops = useMemo(
        () => (defaultData || []).filter((petshop: any) => petshop.name !== ""),
        [defaultData]
    );
    const currentLocation = useLocation();
    const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
    const [cheatsEnabled, setCheatsEnabled] = useState(false);

    const rounds = useMemo(() => {
        if (namedPetshops.length === 0) {
            return [];
        }
        const picked: any[] = [];
        for (let i = 0; i < TOTAL_ROUNDS; i += 1) {
            const currentSelection = namedPetshops[Math.floor(Math.random() * namedPetshops.length)];
            picked.push({
                displayId: firstPetId(currentSelection.id) || String(currentSelection.id),
                image: petImageSrc(currentSelection.id),
                answers: shuffle([
                    currentSelection.name,
                    ...pickWrongNames(namedPetshops, currentSelection.name, 2),
                ]),
                correctAnswer: currentSelection.name,
            });
        }
        return picked;
    }, [namedPetshops, currentLocation.key]);

    useEffect(() => {
        setLocation("/guess-game");
    }, [setLocation]);

    useEffect(() => {
        replay();
        setCurrentGuessIndex(0);
    }, [currentLocation]);

    function answerRight() {
        if (currentGuessIndex < TOTAL_ROUNDS) {
            incrementGameProgress();
            setCurrentGuessIndex((prev) => prev + 1);
        }
    }

    function answerWrong() {
        if (currentGuessIndex < TOTAL_ROUNDS) {
            setCurrentGuessIndex((prev) => prev + 1);
        }
    }

    return (
        <main className="game-page">
            {currentGuessIndex < TOTAL_ROUNDS && rounds[currentGuessIndex] ? (
                <GuessGame
                    selectedPetshop={rounds[currentGuessIndex]}
                    answerRight={answerRight}
                    answerWrong={answerWrong}
                    cheatsEnabled={cheatsEnabled}
                    correctCount={guessGameProgress}
                />
            ) : (
                <FinishGame
                    guessGameProgress={guessGameProgress}
                    replay={replay}
                    setCurrentGuessIndex={setCurrentGuessIndex}
                />
            )}
            <button
                type="button"
                className="cheats"
                onClick={() => setCheatsEnabled((value) => !value)}
                aria-label="Cheats"
            />
            <Footer />
        </main>
    );
};

export default GuessPage;
