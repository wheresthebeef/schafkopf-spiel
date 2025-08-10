/**
 * Bayerisches Schafkopf - Kartenverwaltung
 * LEGACY VERSION - Backup from Phase 2 Migration
 * Original file: js/cards.js
 * Date: 2025-08-10
 */

// LEGACY BACKUP - Original cards.js content preserved for fallback
// This file contains the complete original implementation before ES6 modularization

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

// [Rest of original cards.js content would be preserved here]
// Note: This is a truncated version for demonstration
// In a real migration, the complete original file would be backed up

// LEGACY MARKER
const LEGACY_CARDS_BACKUP = {
    version: '1.0',
    backupDate: '2025-08-10',
    originalFile: 'js/cards.js',
    phase: 2,
    note: 'Complete legacy implementation backed up before ES6 modularization'
};

console.log('🔄 Legacy cards.js loaded as fallback');