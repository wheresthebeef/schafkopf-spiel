/**
 * Mittlere Schwierigkeit: Ausspielen
 */
function selectLeadCardMedium(playableCards, handEvaluation, context) {
    // Früh im Spiel: Niedrige Karten ausspielen
    if (context.trickNumber < 3) {
        const lowCards = playableCards.filter(c => c.points <= 2);
        if (lowCards.length > 0) {
            return getRandomFromArray(lowCards);
        }
    }
    
    // Spät im Spiel: Punkte holen
    if (context.trickNumber >= 6) {
        const highCards = playableCards.filter(c => c.points >= 10);
        if (highCards.length > 0) {
            return getRandomFromArray(highCards);
        }
    }
    
    // Standard: Mittlere Karte
    return playableCards[Math.floor(playableCards.length / 2)];
}

/**
 * Hohe Schwierigkeit: Ausspielen
 */
function selectLeadCardHard(playableCards, handEvaluation, context) {
    // Strategische Überlegungen
    
    // 1. Lange Farbe ausspielen (Gegner zum Abwerfen zwingen)
    const longSuits = findLongSuits(context.players[context.currentPlayer].cards);
    if (longSuits.length > 0) {
        const longSuitCard = playableCards.find(c => 
            longSuits.includes(c.suit) && !c.isTrump && c.points === 0
        );
        if (longSuitCard) return longSuitCard;
    }
    
    // 2. Kleine Trümpfe ziehen (wenn viele hohe Trümpfe auf der Hand)
    if (handEvaluation.highTrumps >= 2) {
        const smallTrumps = playableCards.filter(c => 
            c.isTrump && c.trumpOrder <= 12 && c.points === 0
        );
        if (smallTrumps.length > 0) {
            return getRandomFromArray(smallTrumps);
        }
    }
    
    // 3. Ass/Zehn mit Schutz ausspielen
    const protectedHighCards = findProtectedHighCards(playableCards, context);
    if (protectedHighCards.length > 0) {
        return getRandomFromArray(protectedHighCards);
    }
    
    // Fallback: Mittlere Strategie
    return selectLeadCardMedium(playableCards, handEvaluation, context);
}

/**
 * Wählt Karte als Folgender (nicht erster Spieler im Stich)
 */
function selectFollowCard(playableCards, playerIndex, context, difficulty) {
    const leadCard = context.currentTrick[0].card;
    const currentHighest = getCurrentHighestCardInTrick(context.currentTrick);
    
    switch (difficulty) {
        case 'easy':
            return selectFollowCardEasy(playableCards, leadCard);
            
        case 'medium':
            return selectFollowCardMedium(playableCards, leadCard, currentHighest, context);
            
        case 'hard':
            return selectFollowCardHard(playableCards, leadCard, currentHighest, context);
            
        default:
            return playableCards[0];
    }
}

/**
 * Einfache Schwierigkeit: Folgen
 */
function selectFollowCardEasy(playableCards, leadCard) {
    // Zufällige Auswahl aus spielbaren Karten
    return getRandomFromArray(playableCards);
}

/**
 * Mittlere Schwierigkeit: Folgen
 */
function selectFollowCardMedium(playableCards, leadCard, currentHighest, context) {
    // Kann stechen?
    const canWin = playableCards.filter(c => isCardHigher(c, currentHighest));
    
    if (canWin.length > 0) {
        // Letzter Spieler im Stich: Versuche zu stechen
        if (context.currentTrick.length === 3) {
            return getLowestCard(canWin);
        }
        
        // Nicht letzter: Nur mit hoher Karte stechen
        const worthwhileWins = canWin.filter(c => c.points >= 3 || c.trumpOrder >= 15);
        if (worthwhileWins.length > 0) {
            return getLowestCard(worthwhileWins);
        }
    }
    
    // Kann nicht gewinnen: Niedrigste Karte abwerfen
    return getLowestCard(playableCards);
}

/**
 * Hohe Schwierigkeit: Folgen
 */
function selectFollowCardHard(playableCards, leadCard, currentHighest, context) {
    const trickPoints = context.currentTrick.reduce((sum, tc) => sum + tc.card.points, 0);
    const canWin = playableCards.filter(c => isCardHigher(c, currentHighest));
    
    // Bewerte ob sich Stechen lohnt
    const worthStealing = trickPoints >= 10 || 
                         context.currentTrick.some(tc => tc.card.points >= 10);
    
    if (canWin.length > 0 && worthStealing) {
        // Letzter Spieler: Immer mit niedrigster möglicher Karte stechen
        if (context.currentTrick.length === 3) {
            return getLowestCard(canWin);
        }
        
        // Nicht letzter: Nur stechen wenn sicher oder Notwendigkeit
        const safeWins = canWin.filter(c => 
            c.trumpOrder >= 16 || // Hohe Ober
            (c.isTrump && hasRemainingHigherTrumps(c, context) < 2)
        );
        
        if (safeWins.length > 0) {
            return getLowestCard(safeWins);
        }
    }
    
    // Partnerspiel-Logik (vereinfacht - später erweitern)
    if (isPartnerWinning(context)) {
        // Partner gewinnt: Niedrige Karte abwerfen
        return getLowestCard(playableCards);
    }
    
    // Standardverhalten: Mittlere Logik
    return selectFollowCardMedium(playableCards, leadCard, currentHighest, context);
}

/**
 * Hilfsfunktionen
 */

function getRandomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function selectRandomCard(cards) {
    return getRandomFromArray(cards);
}

function getLowestCard(cards) {
    return cards.reduce((lowest, card) => {
        if (card.isTrump && lowest.isTrump) {
            return card.trumpOrder < lowest.trumpOrder ? card : lowest;
        }
        if (card.isTrump !== lowest.isTrump) {
            return !card.isTrump ? card : lowest;
        }
        return card.points < lowest.points ? card : lowest;
    });
}

function getHighestCard(cards) {
    return cards.reduce((highest, card) => {
        if (card.isTrump && highest.isTrump) {
            return card.trumpOrder > highest.trumpOrder ? card : highest;
        }
        if (card.isTrump !== highest.isTrump) {
            return card.isTrump ? card : highest;
        }
        return card.points > highest.points ? card : highest;
    });
}

function getCurrentHighestCardInTrick(currentTrick) {
    if (currentTrick.length === 0) return null;
    
    let highest = currentTrick[0].card;
    for (let i = 1; i < currentTrick.length; i++) {
        if (isCardHigher(currentTrick[i].card, highest)) {
            highest = currentTrick[i].card;
        }
    }
    return highest;
}

function findLongSuits(cards) {
    const suits = {
        eichel: cards.filter(c => c.suit === 'eichel' && !c.isTrump).length,
        gras: cards.filter(c => c.suit === 'gras' && !c.isTrump).length,
        herz: cards.filter(c => c.suit === 'herz' && !c.isTrump).length,
        schellen: cards.filter(c => c.suit === 'schellen' && !c.isTrump).length
    };
    
    return Object.keys(suits).filter(suit => suits[suit] >= 3);
}

function findProtectedHighCards(playableCards, context) {
    // Vereinfachte Logik: Ass/Zehn mit weiteren Karten der Farbe
    const player = context.players[context.currentPlayer];
    
    return playableCards.filter(card => {
        if (card.points < 10 || card.isTrump) return false;
        
        // Hat weitere Karten dieser Farbe?
        const suitCards = player.cards.filter(c => 
            c.suit === card.suit && !c.isTrump
        );
        
        return suitCards.length >= 2;
    });
}

function hasRemainingHigherTrumps(card, context) {
    if (!card.isTrump) return 0;
    
    // Zähle höhere Trümpfe die noch im Spiel sind
    const allPlayedTrumps = context.completedTricks
        .flatMap(trick => trick.cards)
        .map(tc => tc.card)
        .filter(c => c.isTrump);
    
    const playedHigherTrumps = allPlayedTrumps.filter(c => 
        c.trumpOrder > card.trumpOrder
    ).length;
    
    // Gesamtanzahl höherer Trümpfe minus bereits gespielte
    const totalHigherTrumps = createDeck()
        .filter(c => c.isTrump && c.trumpOrder > card.trumpOrder)
        .length;
    
    return totalHigherTrumps - playedHigherTrumps;
}

function isPartnerWinning(context) {
    // Vereinfachte Partnererkennung - später erweitern für echtes Rufspiel
    if (context.currentTrick.length === 0) return false;
    
    const currentWinner = getCurrentHighestCardInTrick(context.currentTrick);
    const winnerIndex = context.currentTrick.findIndex(tc => tc.card === currentWinner);
    
    // Für jetzt: Einfache Annahme dass Spieler 0 unser Partner ist
    return winnerIndex === 0;
}

/**
 * Erweiterte KI-Funktionen für zukünftige Entwicklung
 */

/**
 * Bewertet eine Karte basierend auf Spielsituation
 */
function evaluateCardValue(card, context, playerIndex) {
    let value = card.points;
    
    // Trumpf-Bonus
    if (card.isTrump) {
        value += card.trumpOrder * 0.5;
    }
    
    // Positions-Bonus (späte Karten wertvoller)
    if (context.currentTrick.length === 3) {
        value *= 1.2;
    }
    
    // Stich-Nummer berücksichtigen
    if (context.trickNumber >= 6) {
        value *= 1.1; // Späte Stiche wichtiger
    }
    
    return value;
}

/**
 * Simuliert mögliche Spielverläufe (Monte Carlo - vereinfacht)
 */
function simulatePlay(card, context, depth = 1) {
    // Placeholder für komplexere KI-Logik
    // Könnte Spielverläufe simulieren und beste Karte finden
    return Math.random(); // Dummy-Bewertung
}

/**
 * Anpassung der KI-Persönlichkeit
 */
function getAIPersonality(playerIndex) {
    const personalities = {
        1: { // Anna - Vorsichtig
            riskTolerance: 0.3,
            aggressiveness: 0.4,
            cooperation: 0.8
        },
        2: { // Hans - Aggressiv
            riskTolerance: 0.8,
            aggressiveness: 0.9,
            cooperation: 0.5
        },
        3: { // Sepp - Ausgewogen
            riskTolerance: 0.6,
            aggressiveness: 0.6,
            cooperation: 0.7
        }
    };
    
    return personalities[playerIndex] || personalities[1];
}

/**
 * Debug-Funktion für KI-Entscheidungen
 */
function debugAIDecision(selectedCard, playableCards, playerIndex, reasoning) {
    if (gameState.debugMode) {
        console.log(`🤖 ${gameState.players[playerIndex].name} wählt: ${selectedCard.symbol}${selectedCard.short}`);
        console.log(`   Optionen waren: ${playableCards.map(c => c.symbol + c.short).join(', ')}`);
        console.log(`   Begründung: ${reasoning}`);
    }
}

// Erweiterte selectCardWithAI mit Debug-Ausgabe
const originalSelectCardWithAI = selectCardWithAI;
selectCardWithAI = function(playableCards, playerIndex, gameContext = null) {
    const selected = originalSelectCardWithAI(playableCards, playerIndex, gameContext);
    
    if (selected && gameState.debugMode) {
        const reasoning = gameContext?.currentTrick.length === 0 ? 
            'Ausspielen' : 'Folgen';
        debugAIDecision(selected, playableCards, playerIndex, reasoning);
    }
    
    return selected;
};
 * Bayerisches Schafkopf - KI-Spieler
 * Implementiert verschiedene KI-Strategien für CPU-Gegner
 */

/**
 * Hauptfunktion für KI-Kartenauswahl
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Index des KI-Spielers
 * @param {Object} gameContext - Aktueller Spielkontext
 * @returns {Object} Ausgewählte Karte
 */
function selectCardWithAI(playableCards, playerIndex, gameContext = null) {
    if (playableCards.length === 0) {
        console.error('AI: Keine spielbaren Karten verfügbar');
        return null;
    }
    
    if (playableCards.length === 1) {
        return playableCards[0];
    }
    
    // Kontext vorbereiten
    const context = gameContext || {
        currentTrick: gameState.currentTrick,
        trickNumber: gameState.trickNumber,
        players: gameState.players,
        completedTricks: gameState.completedTricks
    };
    
    // Schwierigkeitsgrad basierend auf Spieler (später konfigurierbar)
    const difficulty = getAIDifficulty(playerIndex);
    
    // Strategie basierend auf Stichposition wählen
    if (context.currentTrick.length === 0) {
        return selectLeadCard(playableCards, playerIndex, context, difficulty);
    } else {
        return selectFollowCard(playableCards, playerIndex, context, difficulty);
    }
}

/**
 * Bestimmt Schwierigkeitsgrad für KI-Spieler
 * @param {number} playerIndex - Index des Spielers
 * @returns {string} Schwierigkeitsgrad ('easy', 'medium', 'hard')
 */
function getAIDifficulty(playerIndex) {
    // Verschiedene Schwierigkeitsgrade für Abwechslung
    const difficulties = ['medium', 'medium', 'hard'];
    return difficulties[playerIndex - 1] || 'medium';
}

/**
 * Wählt Karte zum Ausspielen (erster Spieler im Stich)
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - KI-Spieler Index
 * @param {Object} context - Spielkontext
 * @param {string} difficulty - Schwierigkeitsgrad
 * @returns {Object} Ausgewählte Karte
 */
function selectLeadCard(playableCards, playerIndex, context, difficulty) {
    const player = context.players[playerIndex];
    const handEvaluation = evaluateHand(player.cards);
    
    // Strategien nach Schwierigkeitsgrad
    switch (difficulty) {
        case 'easy':
            return selectRandomCard(playableCards);
            
        case 'medium':
            return selectLeadCardMedium(playableCards, handEvaluation, context);
            
        case 'hard':
            return selectLeadCardHard(playableCards, handEvaluation, context);
            
        default:
            return playableCards[0];
    }
}

/**