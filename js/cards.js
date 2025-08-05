/**
 * Bayerisches Schafkopf - Kartenverwaltung
 * Definiert Karten, Farben, Werte und Deck-Operationen
 */

// Kartenfarbdefinitionen
const suits = {
    'eichel': { 
        name: 'Eichel', 
        symbol: '🌰', 
        color: 'black',
        displayName: 'E'
    },
    'gras': { 
        name: 'Gras', 
        symbol: '🍀', 
        color: 'green',
        displayName: 'G'
    },
    'herz': { 
        name: 'Herz', 
        symbol: '❤️', 
        color: 'red',
        displayName: 'H'
    },
    'schellen': { 
        name: 'Schellen', 
        symbol: '🔔', 
        color: 'red',
        displayName: 'S'
    }
};

// Kartenwertdefinitionen (korrigiert für Schafkopf)
const values = {
    'sau': { 
        name: 'Sau', 
        short: 'A', 
        points: 11, 
        order: 14,
        displayName: 'Ass'
    },
    'zehn': { 
        name: 'Zehn', 
        short: '10', 
        points: 10, 
        order: 13,
        displayName: '10'
    },
    'koenig': { 
        name: 'König', 
        short: 'K', 
        points: 4, 
        order: 12,
        displayName: 'K'
    },
    'ober': { 
        name: 'Ober', 
        short: 'O', 
        points: 3, 
        order: 11,
        displayName: 'O'
    },
    'unter': { 
        name: 'Unter', 
        short: 'U', 
        points: 2, 
        order: 10,
        displayName: 'U'
    },
    'neun': { 
        name: 'Neun', 
        short: '9', 
        points: 0, 
        order: 9,
        displayName: '9'
    },
    'acht': { 
        name: 'Acht', 
        short: '8', 
        points: 0, 
        order: 8,
        displayName: '8'
    },
    'sieben': { 
        name: 'Sieben', 
        short: '7', 
        points: 0, 
        order: 7,
        displayName: '7'
    }
};

/**
 * Erstellt ein vollständiges Kartendeck (32 Karten)
 * @returns {Array} Array mit allen Kartenobjekten
 */
function createDeck() {
    const deck = [];
    
    for (let suitKey in suits) {
        for (let valueKey in values) {
            const suit = suits[suitKey];
            const value = values[valueKey];
            
            deck.push({
                suit: suitKey,
                value: valueKey,
                name: `${value.name} ${suit.name}`,
                short: value.short,
                symbol: suit.symbol,
                color: suit.color,
                displayName: suit.displayName,
                points: value.points,
                order: value.order,
                isTrump: false,
                trumpOrder: 0,
                id: `${suitKey}_${valueKey}` // Eindeutige ID für Debugging
            });
        }
    }
    
    return deck;
}

/**
 * Mischt ein Kartendeck (Fisher-Yates Algorithmus)
 * @param {Array} deck - Das zu mischende Deck
 * @returns {Array} Das gemischte Deck
 */
function shuffleDeck(deck) {
    const shuffled = [...deck]; // Kopie erstellen
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}

/**
 * Setzt den Trumpf-Status für alle Karten im Deck
 * Ober und Unter sind immer Trumpf, dazu alle Herz-Karten  
 * @param {Array} deck - Das Kartendeck
 */
function setTrumpStatus(deck) {
    deck.forEach(card => {
        // Ober und Unter sind immer Trumpf
        if (card.value === 'ober' || card.value === 'unter') {
            card.isTrump = true;
            
            // Trumpf-Reihenfolge für Ober: Eichel(18), Gras(17), Herz(16), Schellen(15)
            if (card.value === 'ober') {
                switch (card.suit) {
                    case 'eichel': card.trumpOrder = 18; break;
                    case 'gras': card.trumpOrder = 17; break;
                    case 'herz': card.trumpOrder = 16; break;
                    case 'schellen': card.trumpOrder = 15; break;
                }
            }
            // Trumpf-Reihenfolge für Unter: Eichel(14), Gras(13), Herz(12), Schellen(11)
            else if (card.value === 'unter') {
                switch (card.suit) {
                    case 'eichel': card.trumpOrder = 14; break;
                    case 'gras': card.trumpOrder = 13; break;
                    case 'herz': card.trumpOrder = 12; break;
                    case 'schellen': card.trumpOrder = 11; break;
                }
            }
        }
        // Herz-Karten (außer Ober/Unter) sind auch Trumpf
        else if (card.suit === 'herz') {
            card.isTrump = true;
            // Herz-Karten haben NIEDRIGERE trumpOrder als Unter (1-10)
            // Damit die Unter höher stechen als alle Herz-Karten
            card.trumpOrder = card.order - 10; // Ass=4, Zehn=3, König=2, 9=(-1), 8=(-2), 7=(-3)
        }
        // Alle anderen Karten sind kein Trumpf
        else {
            card.isTrump = false;
            card.trumpOrder = 0;
        }
    });
}

/**
 * Sortiert Karten nach Schafkopf-Regeln für die Anzeige
 * Reihenfolge: Alle Ober (Eichel,Gras,Herz,Schelle), Alle Unter (Eichel,Gras,Herz,Schelle), 
 * Herz-Karten (Ass,10,K,9,8,7), andere Farben alphabetisch (Ass,10,K,9,8,7)
 * @param {Array} cards - Array von Karten
 * @returns {Array} Sortierte Karten
 */
function sortCardsForDisplay(cards) {
    return cards.sort((a, b) => {
        // Definiere Anzeige-Prioritäten
        const getDisplayPriority = (card) => {
            // Ober haben höchste Priorität (100-110)
            if (card.value === 'ober') {
                switch (card.suit) {
                    case 'eichel': return 104;
                    case 'gras': return 103;
                    case 'herz': return 102;
                    case 'schellen': return 101;
                }
            }
            
            // Unter haben zweithöchste Priorität (90-99)
            if (card.value === 'unter') {
                switch (card.suit) {
                    case 'eichel': return 94;
                    case 'gras': return 93;
                    case 'herz': return 92;
                    case 'schellen': return 91;
                }
            }
            
            // Herz-Karten (außer Ober/Unter) haben Priorität 70-79 (NACH den Untern!)
            if (card.suit === 'herz') {
                return 70 + card.order;
            }
            
            // Andere Farben: Eichel(60-69), Gras(40-49), Schellen(20-29)
            let basePriority = 0;
            switch (card.suit) {
                case 'eichel': basePriority = 60; break;
                case 'gras': basePriority = 40; break;
                case 'schellen': basePriority = 20; break;
            }
            
            return basePriority + card.order;
        };
        
        return getDisplayPriority(b) - getDisplayPriority(a);
    });
}

/**
 * Sortiert Karten nach Schafkopf-Regeln für die Spiellogik
 * Trümpfe zuerst (nach Trumpf-Reihenfolge), dann Farben alphabetisch
 * @param {Array} cards - Array von Karten
 * @returns {Array} Sortierte Karten
 */
function sortCards(cards) {
    return cards.sort((a, b) => {
        // Beide Trumpf: nach Trumpf-Reihenfolge sortieren
        if (a.isTrump && b.isTrump) {
            return b.trumpOrder - a.trumpOrder;
        }
        
        // Nur a ist Trumpf: a kommt zuerst
        if (a.isTrump && !b.isTrump) {
            return -1;
        }
        
        // Nur b ist Trumpf: b kommt zuerst
        if (!a.isTrump && b.isTrump) {
            return 1;
        }
        
        // Beide keine Trümpfe: erst nach Farbe, dann nach Wert sortieren
        if (a.suit !== b.suit) {
            return a.suit.localeCompare(b.suit);
        }
        
        return b.order - a.order;
    });
}

/**
 * Verteilt Karten an die Spieler
 * @param {Array} deck - Das gemischte Deck
 * @param {number} playerCount - Anzahl der Spieler (normalerweise 4)
 * @returns {Array} Array mit Kartenarrays für jeden Spieler
 */
function dealCards(deck, playerCount = 4) {
    const hands = Array(playerCount).fill(null).map(() => []);
    
    // 8 Karten pro Spieler
    for (let i = 0; i < deck.length; i++) {
        const playerIndex = i % playerCount;
        hands[playerIndex].push(deck[i]);
    }
    
    // Jede Hand mit der neuen Display-Sortierung sortieren
    hands.forEach(hand => sortCardsForDisplay(hand));
    
    return hands;
}

/**
 * Prüft ob eine Karte höher ist als eine andere
 * @param {Object} card1 - Erste Karte
 * @param {Object} card2 - Zweite Karte (Referenzkarte)
 * @returns {boolean} true wenn card1 höher ist
 */
function isCardHigher(card1, card2) {
    // Beide Trumpf: Trumpf-Reihenfolge vergleichen
    if (card1.isTrump && card2.isTrump) {
        return card1.trumpOrder > card2.trumpOrder;
    }
    
    // Nur card1 ist Trumpf: card1 gewinnt
    if (card1.isTrump && !card2.isTrump) {
        return true;
    }
    
    // Nur card2 ist Trumpf: card2 gewinnt
    if (!card1.isTrump && card2.isTrump) {
        return false;
    }
    
    // Beide keine Trümpfe: nur gleiche Farbe kann stechen
    if (card1.suit === card2.suit) {
        return card1.order > card2.order;
    }
    
    // Verschiedene Farben: card2 gewinnt (Farbzwang)
    return false;
}

/**
 * Findet eine Karte in einem Array anhand von Farbe und Wert
 * @param {Array} cards - Array von Karten
 * @param {string} suit - Gesuchte Farbe
 * @param {string} value - Gesuchter Wert
 * @returns {Object|null} Gefundene Karte oder null
 */
function findCard(cards, suit, value) {
    return cards.find(card => card.suit === suit && card.value === value) || null;
}

/**
 * Entfernt eine Karte aus einem Array
 * @param {Array} cards - Array von Karten
 * @param {string} suit - Farbe der zu entfernenden Karte
 * @param {string} value - Wert der zu entfernenden Karte
 * @returns {Object|null} Die entfernte Karte oder null
 */
function removeCard(cards, suit, value) {
    const index = cards.findIndex(card => card.suit === suit && card.value === value);
    if (index !== -1) {
        return cards.splice(index, 1)[0];
    }
    return null;
}

/**
 * Zählt die Punkte in einem Kartenarray
 * @param {Array} cards - Array von Karten
 * @returns {number} Gesamtpunkte
 */
function countPoints(cards) {
    return cards.reduce((sum, card) => sum + card.points, 0);
}

/**
 * Debug-Funktion: Zeigt die komplette Trumpf-Reihenfolge an
 * @param {Array} deck - Das Kartendeck
 */
function debugTrumpOrder(deck) {
    const trumps = deck.filter(card => card.isTrump)
        .sort((a, b) => b.trumpOrder - a.trumpOrder);
    
    console.log('=== TRUMPF-REIHENFOLGE (höchste zuerst) ===');
    trumps.forEach((card, index) => {
        console.log(`${index + 1}. ${card.symbol}${card.short} (${card.suit} ${card.value}) - trumpOrder: ${card.trumpOrder}`);
    });
    console.log('==========================================');
    
    return trumps;
}

/**
 * Debug-Funktion: Gibt Karteninformationen in der Konsole aus
 * @param {Array} cards - Array von Karten
 * @param {string} label - Label für die Ausgabe
 */
function debugCards(cards, label = 'Karten') {
    console.log(`${label}:`, cards.map(card => 
        `${card.symbol}${card.short}${card.isTrump ? '(T)' : ''}`
    ).join(' '));
}

/**
 * Hilfsfunktion: Findet alle Asse in einem Kartenstapel
 * @param {Array} cards - Array von Karten
 * @returns {Array} Array mit allen Assen
 */
function findAces(cards) {
    return cards.filter(card => card.value === 'sau');
}

/**
 * Hilfsfunktion: Findet alle Trümpfe in einem Kartenstapel  
 * @param {Array} cards - Array von Karten
 * @returns {Array} Array mit allen Trümpfen
 */
function findTrumps(cards) {
    return cards.filter(card => card.isTrump);
}

/**
 * Hilfsfunktion: Findet alle Karten einer bestimmten Farbe (ohne Trümpfe)
 * @param {Array} cards - Array von Karten
 * @param {string} suit - Gesuchte Farbe
 * @returns {Array} Array mit Karten der Farbe
 */
function findSuitCards(cards, suit) {
    return cards.filter(card => card.suit === suit && !card.isTrump);
}

/**
 * Validiert ein Kartendeck auf Vollständigkeit und Korrektheit
 * @param {Array} deck - Das zu prüfende Deck
 * @returns {Object} Validierungsergebnis
 */
function validateDeck(deck) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };
    
    // Sollte 32 Karten haben
    if (deck.length !== 32) {
        result.valid = false;
        result.errors.push(`Falsche Anzahl Karten: ${deck.length} statt 32`);
    }
    
    // Alle Farben und Werte prüfen
    const expectedCards = [];
    for (let suit in suits) {
        for (let value in values) {
            expectedCards.push(`${suit}_${value}`);
        }
    }
    
    const deckIds = deck.map(card => card.id);
    expectedCards.forEach(expectedId => {
        if (!deckIds.includes(expectedId)) {
            result.valid = false;
            result.errors.push(`Fehlende Karte: ${expectedId}`);
        }
    });
    
    // Duplikate prüfen
    const duplicates = deckIds.filter((id, index) => deckIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
        result.valid = false;
        result.errors.push(`Doppelte Karten: ${duplicates.join(', ')}`);
    }
    
    // Trumpf-Status prüfen
    const trumps = deck.filter(card => card.isTrump);
    if (trumps.length !== 14) {
        result.warnings.push(`Unerwartete Anzahl Trümpfe: ${trumps.length} statt 14`);
    }
    
    // Punkte prüfen
    const totalPoints = countPoints(deck);
    if (totalPoints !== 120) {
        result.valid = false;
        result.errors.push(`Falsche Gesamtpunkte: ${totalPoints} statt 120`);
    }
    
    return result;
}

// Export für andere Module (falls ES6 Module verwendet werden)
// export { suits, values, createDeck, shuffleDeck, setTrumpStatus, sortCards, sortCardsForDisplay, dealCards, isCardHigher, findCard, removeCard, countPoints, debugCards, findAces, findTrumps, findSuitCards, validateDeck };
