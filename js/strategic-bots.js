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
 * ALIAS: Legacy-Kompatibilität für selectCardWithAI
 * @param {Array} playableCards - Spielbare Karten
 * @param {number} playerIndex - Index des Bot-Spielers
 * @param {Object} gameContext - Aktueller Spielkontext
 * @returns {Object} Ausgewählte Karte
 */
function selectCardWithAI(playableCards, playerIndex, gameContext = null) {
    console.log('🔄 selectCardWithAI → selectCardWithBot (AI-Bridge)');
    return selectCardWithBot(playableCards, playerIndex, gameContext);
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
    window.selectCardWithAI = selectCardWithAI;
    window.selectCardWithBot = selectCardWithBot;
    console.log('🔧 AI functions exported to window');
}

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

function getCurrentTrickWinner(trickCards) {
    if (!trickCards || trickCards.length === 0) return null;
    
    let winner = trickCards[0];
    for (let i = 1; i < trickCards.length; i++) {
        if (isCardHigher(trickCards[i].card, winner.card)) {
            winner = trickCards[i];
        }
    }
    
    return {
        playerIndex: winner.player,
        card: winner.card
    };
}

function getCurrentHighestCardInTrick(trickCards) {
    if (!trickCards || trickCards.length === 0) return null;
    
    let highest = trickCards[0].card;
    for (let i = 1; i < trickCards.length; i++) {
        if (isCardHigher(trickCards[i].card, highest)) {
            highest = trickCards[i].card;
        }
    }
    return highest;
}

function getTrickPointsFromContext(trickCards) {
    return trickCards.reduce((sum, tc) => sum + tc.card.points, 0);
}

/**
 * Bot-Ausspielen-Strategien
 */
function selectLeadCardBot(playableCards, playerIndex, context, difficulty, partnershipsKnown) {
    if (gameState.debugMode) {
        console.log(`🤖 ${gameState.players[playerIndex].name} spielt aus`);
    }
    
    // Einfache Strategie: zufällige Karte
    return playableCards[Math.floor(Math.random() * playableCards.length)];
}

/**
 * Bot-Folgen-Strategien
 */
function selectFollowCardBot(playableCards, playerIndex, context, difficulty, partnershipsKnown) {
    const leadCard = context.currentTrick[0].card;
    const currentHighest = getCurrentHighestCardInTrick(context.currentTrick);
    const canWin = playableCards.filter(c => isCardHigher(c, currentHighest));
    
    if (gameState.debugMode) {
        console.log(`🤖 ${gameState.players[playerIndex].name} folgt`);
    }
    
    // Einfache Strategie: stechen wenn möglich, sonst niedrigste Karte
    if (canWin.length > 0) {
        return getLowestCard(canWin);
    } else {
        return getLowestCard(playableCards);
    }
}

// Placeholder für alle anderen komplexen Funktionen
function handleCalledAceBot() { return null; }
function selectPositionAwareFollow() { return null; }
function selectUnknownPartnershipFollow() { return null; }