/**
 * Bayerisches Schafkopf - Spielregeln und Validierung
 * Implementiert die offiziellen Schafkopf-Regeln inkl. korrekter Ruf-Ass-Regeln
 * 🏗️ REFACTORED: Neue Bidding-Regel-Funktionen hinzugefügt
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
 * 🏗️ REFACTORED: Rufspiel-Bidding-Regeln (aus bidding.js verschoben)
 * Diese Funktionen implementieren die einheitlichen Regeln für Ruf-Ass-Auswahl
 * Werden sowohl von Bots als auch für UI-Validierung verwendet
 */

/**
 * Prüft ob ein Spieler ein bestimmtes Ass rufen kann
 * @param {Array} playerCards - Karten des Spielers
 * @param {string} suit - Zu prüfende Farbe ('eichel', 'gras', 'schellen')
 * @returns {boolean} true wenn Ass rufbar ist
 */
function canCallAce(playerCards, suit) {
    // Regel 1: Spieler darf das Ass dieser Farbe NICHT haben
    const hasOwnAce = playerCards.some(card => 
        card.suit === suit && card.value === 'sau'
    );
    
    if (hasOwnAce) {
        return false; // Kann eigenes Ass nicht rufen
    }
    
    // Regel 2: Spieler muss mindestens eine andere Karte dieser Farbe haben (nicht Trumpf)
    const hasOtherCardsInSuit = playerCards.some(card =>
        card.suit === suit && 
        card.value !== 'sau' &&
        !card.isTrump  // Ober/Unter zählen nicht als Farbe
    );
    
    return hasOtherCardsInSuit;
}

/**
 * Findet alle rufbaren Asse für einen Spieler
 * @param {Array} playerCards - Karten des Spielers
 * @returns {Array} Array mit rufbaren Farben ['eichel', 'gras', ...]
 */
function getCallableAces(playerCards) {
    const suits = ['eichel', 'gras', 'schellen']; // Herz nie rufbar (ist Trumpf)
    
    return suits.filter(suit => canCallAce(playerCards, suit));
}

/**
 * Hilfsfunktion: Prüft ob Spieler ein bestimmtes Ass besitzt
 * @param {Array} playerCards - Karten des Spielers
 * @param {string} suit - Zu prüfende Farbe
 * @returns {boolean} true wenn Spieler das Ass hat
 */
function hasOwnAce(playerCards, suit) {
    return playerCards.some(card => 
        card.suit === suit && card.value === 'sau'
    );
}

/**
 * Validiert ob ein Rufspiel-Gebot regelkonform ist
 * @param {Array} playerCards - Karten des Spielers
 * @param {string} calledSuit - Gerufene Farbe
 * @returns {Object} Validierungsergebnis {valid: boolean, reason: string}
 */
function validateRufspielBid(playerCards, calledSuit) {
    if (!canCallAce(playerCards, calledSuit)) {
        const suitNames = {
            'eichel': 'Eichel',
            'gras': 'Gras', 
            'schellen': 'Schellen'
        };
        
        const hasAce = hasOwnAce(playerCards, calledSuit);
        if (hasAce) {
            return {
                valid: false,
                reason: `Sie können nicht das ${suitNames[calledSuit]}-Ass rufen, da Sie es selbst haben!`
            };
        } else {
            return {
                valid: false,
                reason: `Sie können nicht das ${suitNames[calledSuit]}-Ass rufen, da Sie keine anderen Karten dieser Farbe haben!`
            };
        }
    }
    
    return {
        valid: true,
        reason: 'Rufspiel-Gebot ist regelkonform'
    };
}

[... Rest der rules.js bleibt unverändert ...]

// CLEAN: Export ohne Debug-Spam + Neue Bidding-Regel-Funktionen
if (typeof window !== 'undefined') {
    // Bestehende Funktionen
    window.canPlayCard = canPlayCard;
    window.validateCardPlay = validateCardPlay;
    
    // 🏗️ NEUE: Bidding-Regel-Funktionen exportiert
    window.canCallAce = canCallAce;
    window.getCallableAces = getCallableAces;
    window.hasOwnAce = hasOwnAce;
    window.validateRufspielBid = validateRufspielBid;
    
    console.log('🔧 Rules.js: Clean functions + Bidding rules exported');
}
