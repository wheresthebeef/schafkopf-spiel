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
 * QUICK FIX: Validiert einen Kartenzug nach Schafkopf-Regeln
 * @param {Object} card - Die zu spielende Karte
 * @param {number} playerIndex - Index des Spielers
 * @param {Array} currentTrick - Aktuelle Karten im Stich
 * @param {Array} playerCards - Alle Karten des Spielers
 * @returns {Object} {valid: boolean, reason: string}
 */
function validateCardPlay(card, playerIndex, currentTrick, playerCards) {
    try {
        // Basis-Validierung
        if (!card || !playerCards) {
            return { valid: false, reason: 'Ungültige Parameter' };
        }
        
        // Wenn erster Zug im Stich - alles erlaubt
        if (!currentTrick || currentTrick.length === 0) {
            return { valid: true, reason: 'Ausspielen - alle Karten erlaubt' };
        }
        
        // Farbzwang prüfen
        const firstCard = currentTrick[0].card;
        const leadSuit = firstCard.suit;
        
        // Spezialfall: Trumpf wurde ausgespielt
        if (firstCard.isTrump) {
            // Muss Trumpf zugeben wenn möglich
            const hasTrump = playerCards.some(c => c.isTrump);
            
            if (hasTrump && !card.isTrump) {
                return { valid: false, reason: 'Trumpfzwang - Sie müssen Trumpf zugeben' };
            }
            
            return { valid: true, reason: 'Trumpf korrekt bedient' };
        }
        
        // Normale Farbe wurde ausgespielt
        const hasSuit = playerCards.some(c => c.suit === leadSuit && !c.isTrump);
        
        if (hasSuit) {
            // Hat die Farbe - muss sie bedienen (außer mit Trumpf)
            if (card.suit !== leadSuit && !card.isTrump) {
                return { valid: false, reason: 'Farbzwang - Sie müssen die Farbe bedienen oder trumpfen' };
            }
        } else {
            // Hat die Farbe nicht - kann alles spielen
            return { valid: true, reason: 'Farbe nicht vorhanden - freie Kartenwahl' };
        }
        
        return { valid: true, reason: 'Regelkonformer Zug' };
        
    } catch (error) {
        console.error('validateCardPlay error:', error);
        return { valid: false, reason: 'Validierungsfehler' };
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

// Hilfsfunktionen für andere Module
function isCardHigher(card1, card2) {
    // Vereinfachte Implementierung - Trump sticht immer
    if (card1.isTrump && !card2.isTrump) return true;
    if (!card1.isTrump && card2.isTrump) return false;
    
    // Beide Trumpf oder beide nicht Trumpf - nach Wert vergleichen
    const values = ['7', '8', '9', 'unter', 'ober', 'koenig', '10', 'sau'];
    const value1Index = values.indexOf(card1.value);
    const value2Index = values.indexOf(card2.value);
    
    return value1Index > value2Index;
}

function shouldUseCardImages() {
    // Einfache Implementierung - prüft localStorage
    return localStorage.getItem('useCardImages') === 'true';
}

function getCurrentPlayer() {
    if (!gameState || !gameState.players || gameState.currentPlayer === undefined) {
        return { name: 'Unbekannt' };
    }
    return gameState.players[gameState.currentPlayer] || { name: 'Unbekannt' };
}

// QUICK FIX: Export aller Funktionen inklusive validateCardPlay
if (typeof window !== 'undefined') {
    // Bestehende Funktionen
    window.canPlayCard = canPlayCard;
    window.validateCardPlay = validateCardPlay; // ✅ QUICK FIX
    
    // 🏗️ NEUE: Bidding-Regel-Funktionen exportiert
    window.canCallAce = canCallAce;
    window.getCallableAces = getCallableAces;
    window.hasOwnAce = hasOwnAce;
    window.validateRufspielBid = validateRufspielBid;
    
    // Hilfsfunktionen
    window.isCardHigher = isCardHigher;
    window.shouldUseCardImages = shouldUseCardImages;
    window.getCurrentPlayer = getCurrentPlayer;
    
    console.log('🔧 Rules.js: QUICK FIX - validateCardPlay implementiert + alle Funktionen exportiert');
}
