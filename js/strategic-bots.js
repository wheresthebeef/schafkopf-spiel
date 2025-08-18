/**
 * Bayerisches Schafkopf - Strategische Bots
 * Implementiert verschiedene Bot-Strategien für CPU-Gegner
 * ERWEITERT: Berücksichtigt unbekannte Partnerschaften im Rufspiel
 */

/**
 * Hauptfunktion für Bot-Kartenauswahl (ERWEITERT: Ruf-Ass-Regeln + unbekannte Partnerschaften)
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Index des Bot-Spielers
 * @param {Object} gameContext - Aktueller Spielkontext
 * @returns {Object} Ausgewählte Karte
 */
function selectCardWithBot(playableCards, playerIndex, gameContext = null) {
    if (playableCards.length === 0) {
        console.error('Bot: Keine spielbaren Karten verfügbar');
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
    
    // NEUE LOGIK: Ruf-Ass-Überlegungen für Partner
    if (gameState.gameType === 'rufspiel' && gameState.calledAce && 
        playerIndex === gameState.calledAcePlayer) {
        
        // Spezielle Bot-Logik für den Partner mit dem gerufenen Ass
        const calledAceDecision = handleCalledAceBot(playableCards, playerIndex, context);
        if (calledAceDecision) {
            return calledAceDecision;
        }
    }
    
    // Schwierigkeitsgrad basierend auf Spieler (später konfigurierbar)
    const difficulty = getBotDifficulty(playerIndex);
    
    // NEU: Bei unbekannten Partnerschaften defensive Strategie
    const partnershipsKnown = hasCalledSuitBeenPlayed();
    
    // Strategie basierend auf Stichposition wählen
    if (context.currentTrick.length === 0) {
        return selectLeadCardBot(playableCards, playerIndex, context, difficulty, partnershipsKnown);
    } else {
        return selectFollowCardBot(playableCards, playerIndex, context, difficulty, partnershipsKnown);
    }
}

/**
 * ALIAS FUNCTION: Legacy-Kompatibilität für selectCardWithAI
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Index des Bot-Spielers
 * @param {Object} gameContext - Aktueller Spielkontext
 * @returns {Object} Ausgewählte Karte
 */
function selectCardWithAI(playableCards, playerIndex, gameContext = null) {
    console.log('🔄 selectCardWithAI → selectCardWithBot (AI-Bridge)');
    return selectCardWithBot(playableCards, playerIndex, gameContext);
}

// BROWSER WINDOW BINDING - Für Legacy-Kompatibilität
if (typeof window !== 'undefined') {
    window.selectCardWithAI = selectCardWithAI;
    window.selectCardWithBot = selectCardWithBot;
    
    console.log('🔧 AI-Functions an window exportiert: selectCardWithAI, selectCardWithBot');
}

// Rest des strategic-bots.js Codes bleibt unverändert...
// [Der Rest der Datei würde hier weitergehen, aber wegen der Längenbegrenzung breche ich hier ab]

/**
 * Bestimmt Schwierigkeitsgrad für Bot-Spieler
 * @param {number} playerIndex - Index des Spielers
 * @returns {string} Schwierigkeitsgrad
 */
function getBotDifficulty(playerIndex) {
    const difficulties = ['medium', 'medium', 'hard'];
    return difficulties[playerIndex - 1] || 'medium';
}

/**
 * Hilfsfunktionen
 */
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
        return card.points > highest.points ? card : highest;
    });
}

// Placeholder für alle anderen Funktionen...
// (Vollständige Datei würde alle bestehenden Funktionen beibehalten)
