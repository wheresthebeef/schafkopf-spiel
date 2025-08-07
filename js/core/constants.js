/**
 * Bayerisches Schafkopf - Spielkonstanten
 * Zentrale Definitionen für Regeln, Tarife und Konfiguration
 */

// Grundlegende Spielregeln-Konstanten
export const GAME_RULES = {
    POINTS_TO_WIN: 61,
    POINTS_SCHNEIDER: 91,
    POINTS_SCHNEIDER_FREE: 31,
    TOTAL_POINTS: 120,
    CARDS_PER_PLAYER: 8,
    TRUMP_COUNT: 14,
    PLAYERS_COUNT: 4
};

// Spieltypen mit Hierarchie (höhere Werte = höhere Priorität)
export const GAME_TYPES = {
    RAMSCH: { id: 'ramsch', name: 'Ramsch', priority: 0, isPartnerGame: false },
    RUFSPIEL: { id: 'rufspiel', name: 'Rufspiel', priority: 1, isPartnerGame: true },
    WENZ: { id: 'wenz', name: 'Wenz', priority: 2, isPartnerGame: false },
    FARB_SOLO: { id: 'farbsolo', name: 'Farb-Solo', priority: 3, isPartnerGame: false },
    WENZ_TOUT: { id: 'wenz_tout', name: 'Wenz-Tout', priority: 4, isPartnerGame: false },
    FARB_SOLO_TOUT: { id: 'farbsolo_tout', name: 'Farb-Solo-Tout', priority: 5, isPartnerGame: false },
    SIE: { id: 'sie', name: 'Sie', priority: 6, isPartnerGame: false }
};

// Farben für Solo-Spiele
export const SOLO_SUITS = {
    EICHEL: { id: 'eichel', name: 'Eichel-Solo', symbol: '🌰' },
    GRAS: { id: 'gras', name: 'Gras-Solo', symbol: '🍀' },
    HERZ: { id: 'herz', name: 'Herz-Solo', symbol: '❤️' },
    SCHELLEN: { id: 'schellen', name: 'Schellen-Solo', symbol: '🔔' }
};

// Kartenfarbdefinitionen
export const SUITS = {
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

// Kartenwertdefinitionen
export const VALUES = {
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

// Trumpf-Reihenfolgen für verschiedene Spieltypen
export const TRUMP_ORDERS = {
    RUFSPIEL: {
        // Ober: Eichel(18), Gras(17), Herz(16), Schellen(15)
        // Unter: Eichel(14), Gras(13), Herz(12), Schellen(11)
        // Herz: Ass(4), Zehn(3), König(2), Neun(-1), Acht(-2), Sieben(-3)
        'eichel_ober': 18,
        'gras_ober': 17,
        'herz_ober': 16,
        'schellen_ober': 15,
        'eichel_unter': 14,
        'gras_unter': 13,
        'herz_unter': 12,
        'schellen_unter': 11,
        'herz_sau': 4,
        'herz_zehn': 3,
        'herz_koenig': 2,
        'herz_neun': -1,
        'herz_acht': -2,
        'herz_sieben': -3
    },
    
    WENZ: {
        // Nur Unter sind Trümpfe: Eichel(4), Gras(3), Herz(2), Schellen(1)
        'eichel_unter': 4,
        'gras_unter': 3,
        'herz_unter': 2,
        'schellen_unter': 1
    }
};

// Abrechnungs-Tarife
export const TARIFF_SYSTEM = {
    // Basis-Tarife (in Cent für einfache Berechnung)
    BASE_TARIFF: 10,           // Grundtarif für Rufspiel
    SOLO_TARIFF: 50,           // Basis-Tarif für Solo-Spiele
    
    // Spiel-spezifische Tarife
    GAME_TARIFFS: {
        'rufspiel': 1,             // × BASE_TARIFF
        'wenz': 5,                 // × BASE_TARIFF  
        'farbsolo': 5,             // × BASE_TARIFF
        'wenz_tout': 10,           // × BASE_TARIFF
        'farbsolo_tout': 10,       // × BASE_TARIFF
        'sie': 20                  // × BASE_TARIFF
    },
    
    // Bonus-Multiplier
    SCHNEIDER_BONUS: 1,        // + 1 × BASE_TARIFF
    SCHWARZ_BONUS: 2,          // + 2 × BASE_TARIFF (zusätzlich zu Schneider)
    LAUFENDE_BONUS: 1,         // + 1 × BASE_TARIFF pro Laufende
    
    // Verdopplungen
    KONTRA_MULTIPLIER: 2,      // × 2
    RE_MULTIPLIER: 4,          // × 4 (zusätzlich zu Kontra)
    BOCK_MULTIPLIER: 2,        // × 2
    
    // Laufende-Konfiguration
    MIN_LAUFENDE: 3,           // Mindestanzahl für Laufende
    MAX_LAUFENDE: 8            // Maximale Laufende (alle Ober + Unter)
};

// Spielphasen
export const GAME_PHASES = {
    SETUP: 'setup',
    BIDDING: 'bidding',         // Spielansage
    PLAYING: 'playing',         // Karten spielen
    TRICK_COMPLETED: 'trick_completed',  // Stich beendet, warten auf Weiter
    FINISHED: 'finished'        // Spiel beendet
};

// KI-Schwierigkeitsgrade
export const AI_DIFFICULTIES = {
    EASY: 'easy',
    MEDIUM: 'medium', 
    HARD: 'hard',
    EXPERT: 'expert'
};

// UI-Konfiguration
export const UI_CONFIG = {
    ANIMATION_DURATION: 800,    // Millisekunden für Animationen
    AUTO_PLAY_DELAY: 1500,     // Verzögerung zwischen CPU-Zügen
    TOAST_DURATION: 3000,      // Standard-Toast-Anzeigedauer
    CARD_HOVER_DELAY: 500      // Verzögerung für Hover-Effekte
};

// Debug-Konfiguration
export const DEBUG_CONFIG = {
    LOG_LEVEL: 'info',         // 'debug', 'info', 'warn', 'error'
    MAX_LOG_ENTRIES: 1000,     // Maximale Log-Einträge
    SHOW_AI_THINKING: true,    // KI-Überlegungen anzeigen
    SHOW_CARD_VALUES: true     // Kartenwerte im Debug-Modus
};

// Default-Spielerkonfiguration
export const DEFAULT_PLAYERS = [
    { name: 'Sie', isHuman: true, difficulty: 'human' },
    { name: 'Anna', isHuman: false, difficulty: 'medium' },
    { name: 'Hans', isHuman: false, difficulty: 'medium' },
    { name: 'Sepp', isHuman: false, difficulty: 'hard' }
];

// Farb-Namen für UI-Anzeige
export const SUIT_NAMES = {
    'eichel': 'Eichel',
    'gras': 'Gras', 
    'herz': 'Herz',
    'schellen': 'Schellen'
};

// CSS-Klassen für verschiedene Zustände
export const CSS_CLASSES = {
    PLAYABLE_CARD: 'playable',
    TRUMP_CARD: 'trump',
    CALLED_ACE: 'called-ace',
    WINNING_CARD: 'winning-card',
    ACTIVE_PLAYER: 'active',
    TEAMMATE: 'teammate',
    OPPONENT: 'opponent',
    DEBUG_MODE: 'debug-mode'
};

// Fehlermeldungen
export const ERROR_MESSAGES = {
    INVALID_CARD: 'Diese Karte haben Sie nicht auf der Hand!',
    NOT_YOUR_TURN: 'Sie sind nicht am Zug!',
    MUST_FOLLOW_SUIT: 'Sie müssen die angespielte Farbe bedienen.',
    MUST_FOLLOW_TRUMP: 'Sie müssen Trumpf bedienen.',
    MUST_PLAY_CALLED_ACE: 'Sie müssen das gerufene Ass spielen!',
    CANNOT_DISCARD_ACE: 'Das gerufene Ass darf nicht abgeworfen werden!',
    INSUFFICIENT_CARDS_FOR_RUNAWAY: 'Sie benötigen 4+ Karten dieser Farbe zum Davonlaufen.'
};

// Erfolgsmeldungen
export const SUCCESS_MESSAGES = {
    GAME_WON: 'Glückwunsch! Sie haben gewonnen!',
    GAME_WON_SCHNEIDER: 'Glückwunsch! Sie haben mit Schneider gewonnen!',
    GAME_WON_SCHWARZ: 'Perfekt! Sie haben schwarz gewonnen!',
    GAME_LOST: 'Sie haben verloren.',
    GAME_LOST_SCHNEIDER: 'Sie haben mit Schneider verloren.',
    GAME_LOST_SCHWARZ: 'Sie haben schwarz verloren.'
};
