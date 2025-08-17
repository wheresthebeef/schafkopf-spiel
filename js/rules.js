/**
 * Bayerisches Schafkopf - Spielregeln und Validierung
 * Implementiert die offiziellen Schafkopf-Regeln inkl. korrekter Ruf-Ass-Regeln
 */

/**
 * Prüft ob eine Karte spielbar ist (CLEAN VERSION - Debug entfernt)
 * @param {Object} card - Die zu prüfende Karte
 * @param {number} playerIndex - Index des Spielers
 * @returns {boolean} true wenn Karte spielbar ist
 */
function canPlayCard(card, playerIndex) {
    try {
        // Null/undefined checks
        if (!card || playerIndex === undefined || playerIndex === null) {
            return false;
        }
        
        // GameState checks
        if (!gameState || !gameState.players || !gameState.players[playerIndex]) {
            return false;
        }
        
        // Nur der aktuelle Spieler kann Karten spielen
        if (playerIndex !== gameState.currentPlayer) {
            return false;
        }
        
        // In der Bidding-Phase können keine Karten gespielt werden
        if (gameState.gamePhase !== 'playing') {
            return false;
        }
        
        // Spieler muss die Karte haben
        const player = gameState.players[playerIndex];
        if (!player || !player.cards || !Array.isArray(player.cards)) {
            return false;
        }
        
        const hasCard = player.cards.some(c => c && c.suit === card.suit && c.value === card.value);
        if (!hasCard) {
            return false;
        }
        
        // Regelvalidierung
        let validation;
        try {
            validation = validateCardPlay(card, playerIndex, gameState.currentTrick, player.cards);
        } catch (validationError) {
            console.error('🃏 canPlayCard: validateCardPlay error:', validationError);
            return false;
        }
        
        if (!validation || typeof validation.valid !== 'boolean') {
            console.error('🃏 canPlayCard: Invalid validation result:', validation);
            return false;
        }
        
        return validation.valid;
        
    } catch (error) {
        console.error('🃏 canPlayCard CRITICAL ERROR:', error);
        return false;
    }
}

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
    
    // Erster Spieler im Stich: Spezielle Regeln für Ruf-Ass
    if (currentTrick.length === 0) {
        return validateLeadCard(card, playerIndex, playerCards);
    }
    
    const leadCard = currentTrick[0].card;
    
    // Trumpf wurde angespielt
    if (leadCard.isTrump) {
        return validateTrumpFollow(card, playerCards, playerIndex);
    }
    
    // Farbe wurde angespielt  
    return validateSuitFollow(card, leadCard, playerCards, playerIndex);
}

/**
 * Validiert das Ausspielen (erster Spieler im Stich) - FIXED: Explicit returns
 * @param {Object} card - Die zu spielende Karte
 * @param {number} playerIndex - Index des Spielers
 * @param {Array} playerCards - Karten des Spielers
 * @returns {Object} Validierungsergebnis
 */
function validateLeadCard(card, playerIndex, playerCards) {
    const suitNames = {
        'eichel': 'Eichel',
        'gras': 'Gras',
        'schellen': 'Schellen',
        'herz': 'Herz'
    };
    
    // KORRIGIERTE REGEL: Ruf-Ass Ausspielen-Regeln für den Partner
    if (gameState.gameType === 'rufspiel' && gameState.calledAce && 
        playerIndex === gameState.calledAcePlayer) {
        
        // Das gerufene Ass darf JEDERZEIT ausgespielt werden
        if (card.suit === gameState.calledAce && card.value === 'sau') {
            // Ruf-Ass ausspielen ist immer erlaubt und markiert die Ruffarbe als gespielt
            markCalledSuitPlayed();
            return { valid: true, reason: 'Gerufenes Ass ausgespielt' };
        }
        
        // DAVONLAUFEN: Andere Karten der Ruffarbe nur bei 4+ Karten der Farbe
        if (card.suit === gameState.calledAce && !card.isTrump && card.value !== 'sau') {
            const calledSuitCards = playerCards.filter(c => 
                c.suit === gameState.calledAce && !c.isTrump
            );
            
            // Prüfen ob bereits davongelaufen wurde ODER Davonlaufen möglich ist (4+ Karten)
            if (!hasRunAwayFromCalledSuit() && calledSuitCards.length < 4) {
                return {
                    valid: false,
                    reason: `Davonlaufen: Sie benötigen 4+ ${suitNames[gameState.calledAce]}-Karten um eine andere Karte als das Ass auszuspielen.`
                };
            }
            // Davonlaufen oder bereits davongelaufen - markieren dass Ruffarbe gespielt wurde
            markCalledSuitPlayed();
            return { valid: true, reason: 'Davonlaufen oder Ruffarbe bereits gespielt' };
        }
    }
    
    // FIXED: Explicit return für alle anderen Fälle
    return { valid: true, reason: 'Ausspielen erlaubt' };
}

/**
 * Validiert das Bedienen von Trumpf
 * @param {Object} card - Die zu spielende Karte
 * @param {Array} playerCards - Karten des Spielers
 * @param {number} playerIndex - Index des Spielers
 * @returns {Object} Validierungsergebnis
 */
function validateTrumpFollow(card, playerCards, playerIndex) {
    const hasTrump = playerCards.some(c => c.isTrump);
    
    // Wenn Spieler Trumpf hat, muss Trumpf gespielt werden
    if (hasTrump && !card.isTrump) {
        // NEUE AUSNAHME: Ruf-Ass darf bei Trumpf nicht abgeworfen werden!
        if (isCardCalledAce(card, playerIndex)) {
            const suitNames = {
                'eichel': 'Eichel',
                'gras': 'Gras',
                'schellen': 'Schellen',
                'herz': 'Herz'
            };
            return {
                valid: false,
                reason: `Das gerufene ${suitNames[gameState.calledAce]}-Ass darf nicht abgeworfen werden! Sie müssen Trumpf bedienen.`
            };
        }
        
        return {
            valid: false,
            reason: 'Sie müssen Trumpf bedienen.'
        };
    }
    
    return { valid: true, reason: 'Trumpf korrekt bedient' };
}

/**
 * Validiert das Bedienen einer Farbe (ERWEITERT: Komplette Sau-Zwang und Abwurf-Regeln)
 * @param {Object} card - Die zu spielende Karte
 * @param {Object} leadCard - Angespielte Karte
 * @param {Array} playerCards - Karten des Spielers
 * @param {number} playerIndex - Index des Spielers
 * @returns {Object} Validierungsergebnis
 */
function validateSuitFollow(card, leadCard, playerCards, playerIndex) {
    const suitNames = {
        'eichel': 'Eichel',
        'gras': 'Gras',
        'schellen': 'Schellen',
        'herz': 'Herz'
    };
    
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
                return {
                    valid: false,
                    reason: `Sie müssen das gerufene ${suitNames[gameState.calledAce]}-Ass spielen!`
                };
            }
            // Korrektes gerufenes Ass gespielt - markieren dass Ruffarbe angespielt wurde
            markCalledSuitPlayed();
            return { valid: true, reason: 'Gerufenes Ass korrekt gespielt' };
        } else {
            // Andere Spieler spielen die Ruffarbe an - auch markieren
            markCalledSuitPlayed();
        }
    }
    
    // NEUE REGEL: Ruf-Ass darf nicht abgeworfen werden (außer Ruffarbe wurde bereits gespielt)
    if (gameState.gameType === 'rufspiel' && gameState.calledAce && 
        playerIndex === gameState.calledAcePlayer && 
        isCardCalledAce(card, playerIndex)) {
        
        // Prüfen ob Ruffarbe bereits gespielt wurde
        if (!hasCalledSuitBeenPlayed()) {
            return {
                valid: false,
                reason: `Das gerufene ${suitNames[gameState.calledAce]}-Ass darf nicht abgeworfen werden! Die ${suitNames[gameState.calledAce]}-Farbe muss erst angespielt werden.`
            };
        }
    }
    
    // Standard-Farbzwang: Wenn Spieler die Farbe hat, muss sie bedient werden
    if (hasSuit && (card.suit !== leadCard.suit || card.isTrump)) {
        // NEUE AUSNAHME: Ruf-Ass darf auch hier nicht abgeworfen werden!
        if (isCardCalledAce(card, playerIndex) && !hasCalledSuitBeenPlayed()) {
            return {
                valid: false,
                reason: `Das gerufene ${suitNames[gameState.calledAce]}-Ass darf nicht abgeworfen werden! Sie müssen ${suitNames[leadCard.suit]} bedienen.`
            };
        }
        
        return {
            valid: false,
            reason: `Sie müssen ${suitNames[leadCard.suit]} bedienen.`
        };
    }
    
    return { valid: true, reason: 'Farbe korrekt bedient' };
}

/**
 * Prüft ob eine Karte das gerufene Ass ist
 * @param {Object} card - Zu prüfende Karte
 * @param {number} playerIndex - Index des Spielers
 * @returns {boolean} true wenn es das gerufene Ass ist
 */
function isCardCalledAce(card, playerIndex) {
    return gameState.gameType === 'rufspiel' && 
           gameState.calledAce && 
           playerIndex === gameState.calledAcePlayer &&
           card.suit === gameState.calledAce && 
           card.value === 'sau';
}

/**
 * Prüft ob die Ruffarbe bereits angespielt wurde
 * @returns {boolean} true wenn Ruffarbe bereits gespielt wurde
 */
function hasCalledSuitBeenPlayed() {
    if (!gameState.calledAce || gameState.calledSuitPlayed === undefined) {
        return false;
    }
    return gameState.calledSuitPlayed;
}

/**
 * Markiert dass die Ruffarbe angespielt wurde (FIXED: Kein Return-Value-Problem)
 */
function markCalledSuitPlayed() {
    if (gameState.calledAce && !gameState.calledSuitPlayed) {
        gameState.calledSuitPlayed = true;
        
        if (gameState.debugMode) {
            const suitNames = {
                'eichel': 'Eichel',
                'gras': 'Gras',
                'schellen': 'Schellen',
                'herz': 'Herz'
            };
            console.log(`🎯 ${suitNames[gameState.calledAce]}-Farbe wurde angespielt - Ruf-Ass darf jetzt abgeworfen werden`);
        }
    }
    // FIXED: Keine Rückgabe, damit keine ungewollten Return-Values entstehen
}

/**
 * Prüft ob "Davonlaufen" möglich ist (4+ Karten der Ruffarbe)
 * @param {Array} playerCards - Karten des Spielers
 * @param {string} calledSuit - Ruffarbe
 * @returns {boolean} true wenn Davonlaufen möglich
 */
function canRunAwayFromCalledSuit(playerCards, calledSuit) {
    const calledSuitCards = playerCards.filter(c => 
        c.suit === calledSuit && !c.isTrump
    );
    return calledSuitCards.length >= 4;
}

/**
 * Prüft ob bereits von der Ruffarbe davongelaufen wurde
 * @returns {boolean} true wenn bereits davongelaufen
 */
function hasRunAwayFromCalledSuit() {
    if (!gameState.calledAce) return false;
    
    // Prüfen ob in vergangenen Stichen jemand die Ruffarbe angespielt hat (ohne das Ass)
    for (const completedTrick of gameState.completedTricks) {
        const leadCard = completedTrick.cards[0].card;
        if (leadCard.suit === gameState.calledAce && 
            !leadCard.isTrump && 
            leadCard.value !== 'sau') {
            return true;
        }
    }
    
    // Auch im aktuellen Stich prüfen
    if (gameState.currentTrick.length > 0) {
        const leadCard = gameState.currentTrick[0].card;
        if (leadCard.suit === gameState.calledAce && 
            !leadCard.isTrump && 
            leadCard.value !== 'sau') {
            return true;
        }
    }
    
    return false;
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

/**
 * Initialisiert die Ruffarbe-Tracking für eine neue Runde
 */
function initializeCalledSuitTracking() {
    gameState.calledSuitPlayed = false;
}

/**
 * Debug-Funktion: Zeigt Ruf-Ass Status an
 */
function debugCalledAceStatus() {
    if (gameState.gameType === 'rufspiel' && gameState.calledAce && gameState.calledAcePlayer >= 0) {
        const suitNames = {
            'eichel': 'Eichel',
            'gras': 'Gras',
            'schellen': 'Schellen',
            'herz': 'Herz'
        };
        
        const partnerName = gameState.players[gameState.calledAcePlayer].name;
        const aceCards = gameState.players[gameState.calledAcePlayer].cards.filter(c => 
            c.suit === gameState.calledAce && !c.isTrump
        );
        const canRunAway = aceCards.length >= 4;
        const hasPlayedSuit = hasCalledSuitBeenPlayed();
        
        console.log('=== RUF-ASS STATUS ===');
        console.log(`Gerufenes Ass: ${suitNames[gameState.calledAce]}-Ass`);
        console.log(`Partner: ${partnerName}`);
        console.log(`Karten der Ruffarbe: ${aceCards.length}`);
        console.log(`Davonlaufen möglich: ${canRunAway ? 'Ja' : 'Nein'}`);
        console.log(`Ruffarbe bereits gespielt: ${hasPlayedSuit ? 'Ja' : 'Nein'}`);
        console.log(`Ass darf abgeworfen werden: ${hasPlayedSuit ? 'Ja' : 'Nein'}`);
        console.log('======================');
    }
}

/**
 * DEBUG: Karten-Click Debugging-Funktion (Nur bei Bedarf)
 * @param {number} playerIndex - Spieler zum Testen (Standard: 0)
 */
function debugCardClickability(playerIndex = 0) {
    console.log('🃏 Card Click Debug:');
    console.log('canPlayCard function available:', typeof canPlayCard === 'function');
    console.log('validateCardPlay function available:', typeof validateCardPlay === 'function');
    console.log('gameState.gamePhase:', gameState.gamePhase);
    console.log('gameState.currentPlayer:', gameState.currentPlayer);
    console.log('isPlayerTurn(0):', typeof isPlayerTurn === 'function' ? isPlayerTurn(0) : 'isPlayerTurn not available');
    
    const player = gameState.players[playerIndex];
    if (player && player.cards.length > 0) {
        console.log(`Player ${player.name} has ${player.cards.length} cards`);
        const testCard = player.cards[0];
        console.log(`Test card: ${testCard.symbol}${testCard.short}`);
        console.log('Test card playability:', canPlayCard(testCard, playerIndex));
        
        // Detaillierte Validierung
        const validation = validateCardPlay(testCard, playerIndex, gameState.currentTrick, player.cards);
        console.log('Detailed validation:', validation);
    } else {
        console.log('No player or no cards available for testing');
    }
    
    return {
        canPlayCard: typeof canPlayCard === 'function',
        gamePhase: gameState.gamePhase,
        currentPlayer: gameState.currentPlayer,
        playerTurn: typeof isPlayerTurn === 'function' ? isPlayerTurn(0) : null
    };
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

// CLEAN: Export ohne Debug-Spam
if (typeof window !== 'undefined') {
    // Lösche alte Funktionen falls vorhanden
    delete window.canPlayCard;
    delete window.validateCardPlay;
    
    // Exportiere saubere Versionen
    window.canPlayCard = canPlayCard;
    window.validateCardPlay = validateCardPlay;
    window.debugCardClickability = debugCardClickability;
    window.debugValidation = debugValidation;
    window.debugCalledAceStatus = debugCalledAceStatus;
    
    console.log('🔧 Rules.js: Clean functions exported');
}