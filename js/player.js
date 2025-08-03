/**
 * Bayerisches Schafkopf - Spieler-Management
 * Verwaltet Spieler-Objekte, Karten und Aktionen
 */

/**
 * Erstellt ein neues Spieler-Objekt
 * @param {string} name - Name des Spielers
 * @param {boolean} isHuman - Ist es ein menschlicher Spieler?
 * @param {number} index - Spieler-Index (0-3)
 * @returns {Object} Spieler-Objekt
 */
function createPlayer(name, isHuman = false, index = 0) {
    return {
        name: name,
        isHuman: isHuman,
        index: index,
        cards: [],
        points: 0,
        tricks: 0,
        tricksWon: [],
        
        // Spielstatistiken
        stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalPoints: 0,
            averagePoints: 0,
            schneiderWins: 0,
            schwarzWins: 0
        },
        
        // KI-spezifische Eigenschaften
        aiPersonality: isHuman ? null : getAIPersonality(index),
        
        // Spielverlauf für diese Runde
        roundHistory: {
            cardsPlayed: [],
            tricksParticipated: [],
            pointsEarned: 0
        }
    };
}

/**
 * Fügt eine Karte zur Hand eines Spielers hinzu
 * @param {Object} player - Spieler-Objekt
 * @param {Object} card - Hinzuzufügende Karte
 */
function addCardToPlayer(player, card) {
    player.cards.push(card);
    sortPlayerCards(player);
}

/**
 * Entfernt eine Karte aus der Hand eines Spielers
 * @param {Object} player - Spieler-Objekt
 * @param {string} suit - Kartenfarbe
 * @param {string} value - Kartenwert
 * @returns {Object|null} Entfernte Karte oder null
 */
function removeCardFromPlayer(player, suit, value) {
    const cardIndex = player.cards.findIndex(c => c.suit === suit && c.value === value);
    
    if (cardIndex !== -1) {
        const removedCard = player.cards.splice(cardIndex, 1)[0];
        
        // Zur Rundenverlauf hinzufügen
        player.roundHistory.cardsPlayed.push({
            card: removedCard,
            trickNumber: gameState.trickNumber,
            timestamp: Date.now()
        });
        
        return removedCard;
    }
    
    return null;
}

/**
 * Sortiert die Karten eines Spielers nach Schafkopf-Regeln
 * @param {Object} player - Spieler-Objekt
 */
function sortPlayerCards(player) {
    player.cards = sortCards(player.cards);
}

/**
 * Prüft ob ein Spieler eine bestimmte Karte hat
 * @param {Object} player - Spieler-Objekt
 * @param {string} suit - Kartenfarbe
 * @param {string} value - Kartenwert
 * @returns {boolean} true wenn Karte vorhanden
 */
function playerHasCard(player, suit, value) {
    return player.cards.some(c => c.suit === suit && c.value === value);
}

/**
 * Gibt alle spielbaren Karten eines Spielers zurück
 * @param {Object} player - Spieler-Objekt
 * @param {Array} currentTrick - Aktueller Stich
 * @returns {Array} Array spielbarer Karten
 */
function getPlayableCards(player, currentTrick = []) {
    if (currentTrick.length === 0) {
        // Erster Spieler kann alle Karten spielen
        return [...player.cards];
    }
    
    const leadCard = currentTrick[0].card;
    const playableCards = [];
    
    // Alle Karten prüfen
    for (const card of player.cards) {
        const validation = validateCardPlay(card, player.index, currentTrick, player.cards);
        if (validation.valid) {
            playableCards.push(card);
        }
    }
    
    // Fallback: Wenn keine Karte spielbar ist (sollte nicht passieren)
    if (playableCards.length === 0) {
        console.warn(`Spieler ${player.name} hat keine spielbaren Karten!`);
        return [...player.cards];
    }
    
    return playableCards;
}

/**
 * Fügt Punkte zu einem Spieler hinzu
 * @param {Object} player - Spieler-Objekt
 * @param {number} points - Hinzuzufügende Punkte
 */
function addPointsToPlayer(player, points) {
    player.points += points;
    player.roundHistory.pointsEarned += points;
}

/**
 * Fügt einen gewonnenen Stich zu einem Spieler hinzu
 * @param {Object} player - Spieler-Objekt
 * @param {Array} trickCards - Karten des gewonnenen Stichs
 * @param {number} trickPoints - Punkte des Stichs
 */
function addTrickToPlayer(player, trickCards, trickPoints) {
    player.tricks++;
    player.tricksWon.push([...trickCards]);
    
    const trickInfo = {
        trickNumber: gameState.trickNumber,
        cards: [...trickCards],
        points: trickPoints,
        timestamp: Date.now()
    };
    
    player.roundHistory.tricksParticipated.push(trickInfo);
}

/**
 * Setzt einen Spieler für eine neue Runde zurück
 * @param {Object} player - Spieler-Objekt
 */
function resetPlayerForNewRound(player) {
    player.cards = [];
    player.points = 0;
    player.tricks = 0;
    player.tricksWon = [];
    
    // Rundenverlauf zurücksetzen
    player.roundHistory = {
        cardsPlayed: [],
        tricksParticipated: [],
        pointsEarned: 0
    };
}

/**
 * Aktualisiert die Spielerstatistiken nach einem Spiel
 * @param {Object} player - Spieler-Objekt
 * @param {boolean} hasWon - Hat der Spieler gewonnen?
 * @param {boolean} schneider - Mit Schneider gewonnen/verloren?
 * @param {boolean} schwarz - Schwarz gewonnen/verloren?
 */
function updatePlayerStats(player, hasWon, schneider = false, schwarz = false) {
    player.stats.gamesPlayed++;
    player.stats.totalPoints += player.points;
    player.stats.averagePoints = player.stats.totalPoints / player.stats.gamesPlayed;
    
    if (hasWon) {
        player.stats.gamesWon++;
        
        if (schneider) {
            player.stats.schneiderWins++;
        }
        
        if (schwarz) {
            player.stats.schwarzWins++;
        }
    }
}

/**
 * Analysiert die Hand eines Spielers
 * @param {Object} player - Spieler-Objekt
 * @returns {Object} Handanalyse
 */
function analyzePlayerHand(player) {
    const analysis = evaluateHand(player.cards);
    
    // Erweiterte Analyse
    const trumps = player.cards.filter(c => c.isTrump);
    const nonTrumps = player.cards.filter(c => !c.isTrump);
    
    // Farb-Verteilung (ohne Trümpfe)
    const suitDistribution = {
        eichel: nonTrumps.filter(c => c.suit === 'eichel').length,
        gras: nonTrumps.filter(c => c.suit === 'gras').length,
        herz: nonTrumps.filter(c => c.suit === 'herz').length,
        schellen: nonTrumps.filter(c => c.suit === 'schellen').length
    };
    
    // Besondere Karten
    const aces = player.cards.filter(c => c.value === 'sau');
    const tens = player.cards.filter(c => c.value === 'zehn');
    const highTrumps = trumps.filter(c => c.trumpOrder >= 15); // Ober
    
    return {
        ...analysis,
        trumps: trumps.length,
        nonTrumps: nonTrumps.length,
        suitDistribution,
        specialCards: {
            aces: aces.length,
            tens: tens.length,
            highTrumps: highTrumps.length
        },
        voidSuits: Object.keys(suitDistribution).filter(suit => suitDistribution[suit] === 0),
        longSuits: Object.keys(suitDistribution).filter(suit => suitDistribution[suit] >= 4)
    };
}

/**
 * Gibt eine Zusammenfassung der Spielerleistung zurück
 * @param {Object} player - Spieler-Objekt
 * @returns {Object} Leistungszusammenfassung
 */
function getPlayerPerformance(player) {
    const winRate = player.stats.gamesPlayed > 0 ? 
        (player.stats.gamesWon / player.stats.gamesPlayed * 100).toFixed(1) : 0;
    
    return {
        name: player.name,
        isHuman: player.isHuman,
        currentPoints: player.points,
        currentTricks: player.tricks,
        stats: {
            gamesPlayed: player.stats.gamesPlayed,
            winRate: `${winRate}%`,
            averagePoints: player.stats.averagePoints.toFixed(1),
            schneiderWins: player.stats.schneiderWins,
            schwarzWins: player.stats.schwarzWins
        },
        handStrength: player.cards.length > 0 ? 
            analyzePlayerHand(player).strength : 0
    };
}

/**
 * Prüft ob ein Spieler bestimmte Karten-Kombinationen hat
 * @param {Object} player - Spieler-Objekt
 * @param {string} combination - Art der Kombination
 * @returns {boolean|number} Ergebnis der Prüfung
 */
function checkPlayerCombination(player, combination) {
    switch (combination) {
        case 'allOber':
            return player.cards.filter(c => c.value === 'ober').length === 4;
            
        case 'allUnter':
            return player.cards.filter(c => c.value === 'unter').length === 4;
            
        case 'sie':
            const oberCount = player.cards.filter(c => c.value === 'ober').length;
            const unterCount = player.cards.filter(c => c.value === 'unter').length;
            return oberCount === 4 && unterCount === 4;
            
        case 'longTrump':
            return player.cards.filter(c => c.isTrump).length;
            
        case 'voidSuit':
            const analysis = analyzePlayerHand(player);
            return analysis.voidSuits.length;
            
        case 'allAces':
            return player.cards.filter(c => c.value === 'sau').length;
            
        default:
            return false;
    }
}

/**
 * Simuliert einen Spielerzug für Testzwecke
 * @param {Object} player - Spieler-Objekt
 * @param {Array} currentTrick - Aktueller Stich
 * @returns {Object|null} Ausgewählte Karte oder null
 */
function simulatePlayerMove(player, currentTrick = []) {
    if (player.cards.length === 0) return null;
    
    const playableCards = getPlayableCards(player, currentTrick);
    
    if (player.isHuman) {
        // Für menschliche Spieler: Erste spielbare Karte (für Tests)
        return playableCards[0];
    } else {
        // Für KI: KI-Entscheidung verwenden
        return selectCardWithAI(playableCards, player.index);
    }
}

/**
 * Erstellt einen Klon eines Spielers (für Simulationen)
 * @param {Object} player - Original-Spieler
 * @returns {Object} Geklonter Spieler
 */
function clonePlayer(player) {
    return {
        ...player,
        cards: [...player.cards],
        tricksWon: [...player.tricksWon],
        stats: { ...player.stats },
        roundHistory: {
            cardsPlayed: [...player.roundHistory.cardsPlayed],
            tricksParticipated: [...player.roundHistory.tricksParticipated],
            pointsEarned: player.roundHistory.pointsEarned
        }
    };
}

/**
 * Debug-Funktion: Gibt Spielerinformationen aus
 * @param {Object} player - Spieler-Objekt
 * @param {boolean} showCards - Sollen Karten angezeigt werden?
 */
function debugPlayer(player, showCards = true) {
    console.log(`=== ${player.name} (${player.isHuman ? 'Human' : 'AI'}) ===`);
    console.log(`Punkte: ${player.points}, Stiche: ${player.tricks}`);
    
    if (showCards && player.cards.length > 0) {
        debugCards(player.cards, 'Karten');
        
        const analysis = analyzePlayerHand(player);
        console.log(`Handstärke: ${analysis.strength.toFixed(1)}`);
        console.log(`Trümpfe: ${analysis.trumps}, Hohe Trümpfe: ${analysis.specialCards.highTrumps}`);
        console.log(`Farb-Verteilung:`, analysis.suitDistribution);
    }
    
    if (player.stats.gamesPlayed > 0) {
        const performance = getPlayerPerformance(player);
        console.log(`Siegesrate: ${performance.stats.winRate}, Ø Punkte: ${performance.stats.averagePoints}`);
    }
}

/**
 * Utility-Funktion: Findet Spieler nach Name
 * @param {string} name - Name des Spielers
 * @returns {Object|null} Gefundener Spieler oder null
 */
function findPlayerByName(name) {
    return gameState.players.find(p => p.name === name) || null;
}

/**
 * Utility-Funktion: Gibt den menschlichen Spieler zurück
 * @returns {Object|null} Menschlicher Spieler oder null
 */
function getHumanPlayer() {
    return gameState.players.find(p => p.isHuman) || null;
}

/**
 * Utility-Funktion: Gibt alle KI-Spieler zurück
 * @returns {Array} Array der KI-Spieler
 */
function getAIPlayers() {
    return gameState.players.filter(p => !p.isHuman);
}