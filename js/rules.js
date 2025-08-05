/**
 * Bayerisches Schafkopf - Spielregeln und Validierung
 * Implementiert die offiziellen Schafkopf-Regeln
 */

/**
 * Validiert einen Spielzug nach Schafkopf-Regeln
 * @param {Object} card - Die zu spielende Karte
 * @param {number} playerIndex - Index des Spielers
 * @param {Array} currentTrick - Aktueller Stich
 * @param {Array} playerCards - Karten des Spielers
 * @returns {Object} Validierungsergebnis {valid: boolean, reason: string}
 */
function validateCardPlay(card, playerIndex, currentTrick, playerCards) {
    // Grundvalidierung: Hat der Spieler die Karte?
    if (!playerCards.find(c => c.suit === card.suit && c.value === card.value)) {
        return {
            valid: false,
            reason: 'Sie haben diese Karte nicht auf der Hand.'
        };
    }
    
    // Erster Spieler im Stich kann alles spielen
    if (currentTrick.length === 0) {
        return { valid: true, reason: 'Ausspielen erlaubt' };
    }
    
    const leadCard = currentTrick[0].card;
    
    // Trumpf wurde angespielt
    if (leadCard.isTrump) {
        return validateTrumpFollow(card, playerCards);
    }
    
    // Farbe wurde angespielt  
    return validateSuitFollow(card, leadCard, playerCards, playerIndex);
}

/**
 * Validiert das Bedienen von Trumpf
 * @param {Object} card - Die zu spielende Karte
 * @param {Array} playerCards - Karten des Spielers
 * @returns {Object} Validierungsergebnis
 */
function validateTrumpFollow(card, playerCards) {
    const hasTrump = playerCards.some(c => c.isTrump);
    
    // Wenn Spieler Trumpf hat, muss Trumpf gespielt werden
    if (hasTrump && !card.isTrump) {
        return {
            valid: false,
            reason: 'Sie müssen Trumpf bedienen.'
        };
    }
    
    return { valid: true, reason: 'Trumpf korrekt bedient' };
}

/**
 * Validiert das Bedienen einer Farbe (ERWEITERT: Sau-Zwang für Rufspiel)
 * @param {Object} card - Die zu spielende Karte
 * @param {Object} leadCard - Angespielte Karte
 * @param {Array} playerCards - Karten des Spielers
 * @param {number} playerIndex - Index des Spielers
 * @returns {Object} Validierungsergebnis
 */
function validateSuitFollow(card, leadCard, playerCards, playerIndex) {
    // Prüfe ob Spieler die angespielte Farbe hat (ohne Trümpfe)
    const hasSuit = playerCards.some(c => 
        c.suit === leadCard.suit && !c.isTrump
    );
    
    // SAU-ZWANG REGEL: Wenn Farbe des gerufenen Asses ausgespielt wird
    if (gameState.gameType === 'rufspiel' && gameState.calledAce && 
        leadCard.suit === gameState.calledAce && !leadCard.isTrump) {
        
        // Prüfen ob dieser Spieler das gerufene Ass hat
        const hasCalledAce = playerCards.some(c => 
            c.suit === gameState.calledAce && c.value === 'sau'
        );
        
        if (hasCalledAce) {
            // Spieler MUSS das gerufene Ass spielen
            if (!(card.suit === gameState.calledAce && card.value === 'sau')) {
                const suitNames = {
                    'eichel': 'Eichel',
                    'gras': 'Gras',
                    'schellen': 'Schellen',
                    'herz': 'Herz'
                };
                return {
                    valid: false,
                    reason: `Sie müssen das gerufene ${suitNames[gameState.calledAce]}-Ass spielen!`
                };
            }
            // Korrektes gerufenes Ass gespielt
            return { valid: true, reason: 'Gerufenes Ass korrekt gespielt' };
        }
    }
    
    // Standard-Farbzwang: Wenn Spieler die Farbe hat, muss sie bedient werden
    if (hasSuit && (card.suit !== leadCard.suit || card.isTrump)) {
        const suitNames = {
            'eichel': 'Eichel',
            'gras': 'Gras',
            'schellen': 'Schellen',
            'herz': 'Herz'
        };
        return {
            valid: false,
            reason: `Sie müssen ${suitNames[leadCard.suit]} bedienen.`
        };
    }
    
    return { valid: true, reason: 'Farbe korrekt bedient' };
}

/**
 * Ermittelt den Gewinner eines Stichs
 * @param {Array} trickCards - Array der Stichkarten mit Spieler-Info
 * @returns {Object} Gewinner-Info {winnerIndex, winningCard, points}
 */
function determineTrickWinner(trickCards) {
    if (trickCards.length !== 4) {
        throw new Error('Unvollständiger Stich');
    }
    
    let winnerIndex = 0;
    let winningCard = trickCards[0].card;
    
    // Höchste Karte finden
    for (let i = 1; i < trickCards.length; i++) {
        const currentCard = trickCards[i].card;
        
        if (isCardHigher(currentCard, winningCard)) {
            winningCard = currentCard;
            winnerIndex = i;
        }
    }
    
    // Punkte zählen
    const points = trickCards.reduce((sum, tc) => sum + tc.card.points, 0);
    
    return {
        winnerIndex: winnerIndex,
        winnerPlayerIndex: trickCards[winnerIndex].player,
        winningCard: winningCard,
        points: points
    };
}

/**
 * Bewertet eine Kartenhand nach Stärke
 * @param {Array} cards - Kartenhand
 * @returns {Object} Handbewertung
 */
function evaluateHand(cards) {
    const trumps = cards.filter(c => c.isTrump);
    const suits = {
        eichel: cards.filter(c => c.suit === 'eichel' && !c.isTrump),
        gras: cards.filter(c => c.suit === 'gras' && !c.isTrump),
        herz: cards.filter(c => c.suit === 'herz' && !c.isTrump),
        schellen: cards.filter(c => c.suit === 'schellen' && !c.isTrump)
    };
    
    const totalPoints = countPoints(cards);
    const highTrumps = trumps.filter(c => c.trumpOrder >= 15).length; // Ober
    const longSuits = Object.values(suits).filter(suit => suit.length >= 4);
    
    return {
        trumpCount: trumps.length,
        highTrumps: highTrumps,
        totalPoints: totalPoints,
        longSuits: longSuits.length,
        distribution: {
            eichel: suits.eichel.length,
            gras: suits.gras.length,
            herz: suits.herz.length,
            schellen: suits.schellen.length
        },
        strength: calculateHandStrength(trumps.length, highTrumps, totalPoints)
    };
}

/**
 * Berechnet die Stärke einer Hand (0-100)
 * @param {number} trumpCount - Anzahl Trümpfe
 * @param {number} highTrumps - Anzahl hohe Trümpfe
 * @param {number} totalPoints - Gesamtpunkte
 * @returns {number} Handstärke (0-100)
 */
function calculateHandStrength(trumpCount, highTrumps, totalPoints) {
    let strength = 0;
    
    // Trumpf-Bewertung (max 40 Punkte)
    strength += trumpCount * 4;
    strength += highTrumps * 6;
    
    // Punkte-Bewertung (max 30 Punkte)
    strength += Math.min(totalPoints, 60) / 2;
    
    // Bonus für sehr starke Hände
    if (trumpCount >= 6) strength += 10;
    if (highTrumps >= 3) strength += 10;
    if (totalPoints >= 80) strength += 10;
    
    return Math.min(strength, 100);
}

/**
 * Prüft ob ein Spiel gewonnen wurde
 * @param {number} points - Erreichte Punkte
 * @param {boolean} isPlayerTeam - Ist es das Spieler-Team?
 * @returns {Object} Spielergebnis
 */
function checkGameResult(points, isPlayerTeam = true) {
    const result = {
        won: points >= 61,
        schneider: false,
        schwarz: false,
        points: points
    };
    
    if (result.won) {
        result.schneider = points >= 91;
        result.schwarz = points === 120;
    } else {
        result.schneider = points <= 30;
        result.schwarz = points === 0;
    }
    
    return result;
}

/**
 * Berechnet Spielpunkte nach bayerischen Regeln
 * @param {Object} gameResult - Spielergebnis
 * @param {string} gameType - Spieltyp ('rufspiel', 'solo', etc.)
 * @returns {number} Spielpunkte
 */
function calculateGamePoints(gameResult, gameType = 'rufspiel') {
    let points = 1; // Grundpunkte
    
    // Schneider/Schwarz-Bonus
    if (gameResult.schneider) points += 1;
    if (gameResult.schwarz) points += 1;
    
    // Solo-Bonus
    if (gameType === 'solo') points *= 2;
    if (gameType === 'wenz') points *= 2;
    
    // Verloren: Negative Punkte
    if (!gameResult.won) points = -points;
    
    return points;
}

/**
 * Validiert Spielansagen (für spätere Erweiterungen)
 * @param {string} gameType - Gewünschter Spieltyp
 * @param {Array} playerCards - Karten des Spielers
 * @returns {Object} Validierungsergebnis
 */
function validateGameBid(gameType, playerCards) {
    const handEvaluation = evaluateHand(playerCards);
    
    switch (gameType) {
        case 'rufspiel':
            return {
                valid: true,
                confidence: Math.min(handEvaluation.strength / 60, 1),
                reason: 'Rufspiel immer möglich'
            };
            
        case 'solo':
            return {
                valid: handEvaluation.strength >= 70,
                confidence: handEvaluation.strength / 100,
                reason: handEvaluation.strength >= 70 ? 
                    'Hand stark genug für Solo' : 
                    'Hand zu schwach für Solo'
            };
            
        case 'wenz':
            const unterCount = playerCards.filter(c => c.value === 'unter').length;
            return {
                valid: unterCount >= 2,
                confidence: unterCount / 4,
                reason: unterCount >= 2 ? 
                    `${unterCount} Unter für Wenz` : 
                    'Zu wenige Unter für Wenz'
            };
            
        default:
            return {
                valid: false,
                confidence: 0,
                reason: 'Unbekannter Spieltyp'
            };
    }
}

/**
 * Hilfsfunktion: Prüft ob Karte in bestimmter Reihenfolge spielbar ist
 * @param {Array} cards - Verfügbare Karten
 * @param {Array} preferenceOrder - Bevorzugte Reihenfolge (Kartenwerte)
 * @returns {Object|null} Erste passende Karte oder null
 */
function findCardByPreference(cards, preferenceOrder) {
    for (const preference of preferenceOrder) {
        const card = cards.find(c => c.value === preference);
        if (card) return card;
    }
    return null;
}

/**
 * Debug-Funktion: Gibt Regelvalidierung in Konsole aus
 * @param {Object} card - Karte
 * @param {number} playerIndex - Spieler
 * @param {Array} currentTrick - Stich
 * @param {Array} playerCards - Spielerkarten
 */
function debugValidation(card, playerIndex, currentTrick, playerCards) {
    const validation = validateCardPlay(card, playerIndex, currentTrick, playerCards);
    console.log(`Regelvalidierung für ${card.symbol}${card.short}:`, validation);
}

// Exportierte Konstanten für Spielregeln
const GAME_RULES = {
    POINTS_TO_WIN: 61,
    POINTS_SCHNEIDER: 91,
    POINTS_SCHNEIDER_FREE: 31,
    TOTAL_POINTS: 120,
    CARDS_PER_PLAYER: 8,
    TRUMP_COUNT: 14
};

const GAME_TYPES = {
    RUFSPIEL: 'rufspiel',
    SOLO: 'solo',
    WENZ: 'wenz',
    FARBSOLO: 'farbsolo'
};