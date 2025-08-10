/**
 * Bayerisches Schafkopf - Kartendefinitionen
 * ES6 Module: Grundlegende Karten-, Farb- und Wertdefinitionen
 */

// Kartenfarbdefinitionen
export const suits = {
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
export const values = {
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
 * Erstellt ein Kartenobjekt
 * @param {string} suitKey - Farbschlüssel
 * @param {string} valueKey - Wertschlüssel
 * @returns {Object} Kartenobjekt
 */
export function createCard(suitKey, valueKey) {
    const suit = suits[suitKey];
    const value = values[valueKey];
    
    if (!suit || !value) {
        throw new Error(`Ungültiger Farbschlüssel '${suitKey}' oder Wertschlüssel '${valueKey}'`);
    }
    
    return {
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
        id: `${suitKey}_${valueKey}`
    };
}

/**
 * Debugging und Validierung
 */
export const CARD_CONSTANTS = {
    TOTAL_CARDS: 32,
    CARDS_PER_PLAYER: 8,
    TOTAL_POINTS: 120,
    TRUMP_COUNT: 14
};

console.log('🃏 Card definitions module loaded');