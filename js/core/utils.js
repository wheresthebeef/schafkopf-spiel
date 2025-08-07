/**
 * Bayerisches Schafkopf - Hilfsfunktionen und Utilities
 * Gemeinsame Funktionen für Logging, Debugging und allgemeine Operationen
 */

import { DEBUG_CONFIG, ERROR_MESSAGES } from './constants.js';

/**
 * Protokolliert eine Spielaktion mit Zeitstempel
 * @param {string} action - Beschreibung der Aktion
 * @param {Object} data - Zusätzliche Daten
 * @param {string} level - Log-Level ('debug', 'info', 'warn', 'error')
 */
export function logGameAction(action, data = {}, level = 'info') {
    // Sicherheitsprüfung: gameLog initialisieren falls nicht vorhanden
    if (!window.gameState?.gameLog) {
        if (window.gameState) {
            window.gameState.gameLog = [];
        } else {
            return; // Kein gameState verfügbar
        }
    }
    
    const logEntry = {
        timestamp: Date.now(),
        action: action,
        data: data,
        level: level,
        gamePhase: window.gameState?.gamePhase || 'unknown',
        currentPlayer: window.gameState?.currentPlayer || -1,
        trickNumber: window.gameState?.trickNumber || 0
    };
    
    window.gameState.gameLog.push(logEntry);
    
    // Log-Größe begrenzen
    if (window.gameState.gameLog.length > DEBUG_CONFIG.MAX_LOG_ENTRIES) {
        window.gameState.gameLog.shift();
    }
    
    // In Debug-Modus auch in Konsole ausgeben
    if (window.gameState?.debugMode && shouldLog(level)) {
        const timeStr = new Date().toLocaleTimeString();
        console.log(`[${timeStr}] ${level.toUpperCase()}: ${action}`, data);
    }
}

/**
 * Prüft ob ein Log-Level ausgegeben werden soll
 * @param {string} level - Zu prüfender Log-Level
 * @returns {boolean} true wenn ausgegeben werden soll
 */
function shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(DEBUG_CONFIG.LOG_LEVEL);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
}

/**
 * Zeigt Debug-Informationen für eine Kartenhand
 * @param {Array} cards - Array von Karten
 * @param {string} label - Label für die Ausgabe
 */
export function debugCards(cards, label = 'Karten') {
    if (!window.gameState?.debugMode) return;
    
    const cardStr = cards.map(card => 
        `${card.symbol}${card.short}${card.isTrump ? '(T)' : ''}`
    ).join(' ');
    
    console.log(`${label}: ${cardStr}`);
}

/**
 * Erstellt eine eindeutige ID für eine Karte
 * @param {string} suit - Kartenfarbe
 * @param {string} value - Kartenwert
 * @returns {string} Eindeutige Karten-ID
 */
export function createCardId(suit, value) {
    return `${suit}_${value}`;
}

/**
 * Parsed eine Karten-ID zurück in Farbe und Wert
 * @param {string} cardId - Karten-ID
 * @returns {Object} {suit, value} oder null bei Fehler
 */
export function parseCardId(cardId) {
    const parts = cardId.split('_');
    if (parts.length === 2) {
        return { suit: parts[0], value: parts[1] };
    }
    return null;
}

/**
 * Generiert eine zufällige UUID für Spiel-Sessions
 * @returns {string} UUID-String
 */
export function generateGameId() {
    return 'game_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Formatiert eine Zeitdauer in lesbaren Text
 * @param {number} milliseconds - Zeitdauer in Millisekunden
 * @returns {string} Formatierte Zeit
 */
export function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Validiert einen Spieler-Index
 * @param {number} playerIndex - Zu prüfender Index
 * @returns {boolean} true wenn gültiger Index
 */
export function isValidPlayerIndex(playerIndex) {
    return Number.isInteger(playerIndex) && 
           playerIndex >= 0 && 
           playerIndex < 4;
}

/**
 * Berechnet den nächsten Spieler-Index im Uhrzeigersinn
 * @param {number} currentPlayer - Aktueller Spieler
 * @returns {number} Nächster Spieler-Index
 */
export function getNextPlayerIndex(currentPlayer) {
    return (currentPlayer + 1) % 4;
}

/**
 * Berechnet den vorherigen Spieler-Index (gegen Uhrzeigersinn)
 * @param {number} currentPlayer - Aktueller Spieler  
 * @returns {number} Vorheriger Spieler-Index
 */
export function getPreviousPlayerIndex(currentPlayer) {
    return (currentPlayer + 3) % 4;
}

/**
 * Prüft ob zwei Arrays gleich sind (oberflächlich)
 * @param {Array} arr1 - Erstes Array
 * @param {Array} arr2 - Zweites Array
 * @returns {boolean} true wenn Arrays gleich sind
 */
export function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((value, index) => value === arr2[index]);
}

/**
 * Erstellt eine tiefe Kopie eines Objekts (nur für JSON-serialisierbare Objekte)
 * @param {Object} obj - Zu kopierendes Objekt
 * @returns {Object} Tiefe Kopie
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Überprüft ob ein Wert leer ist (null, undefined, leerer String)
 * @param {*} value - Zu prüfender Wert
 * @returns {boolean} true wenn leer
 */
export function isEmpty(value) {
    return value === null || value === undefined || value === '';
}

/**
 * Sicherer Zugriff auf verschachtelte Objekteigenschaften
 * @param {Object} obj - Objekt
 * @param {string} path - Pfad wie 'a.b.c'
 * @param {*} defaultValue - Standard-Wert wenn Pfad nicht existiert
 * @returns {*} Wert oder Standard-Wert
 */
export function safeGet(obj, path, defaultValue = null) {
    try {
        return path.split('.').reduce((current, key) => current[key], obj) ?? defaultValue;
    } catch {
        return defaultValue;
    }
}

/**
 * Erstellt eine benutzerfreundliche Fehlermeldung
 * @param {string} errorKey - Schlüssel aus ERROR_MESSAGES
 * @param {Object} params - Parameter für die Nachricht
 * @returns {string} Formatierte Fehlermeldung
 */
export function getErrorMessage(errorKey, params = {}) {
    let message = ERROR_MESSAGES[errorKey] || errorKey;
    
    // Parameter in die Nachricht einsetzen
    Object.keys(params).forEach(key => {
        message = message.replace(`{${key}}`, params[key]);
    });
    
    return message;
}

/**
 * Erstellt einen Zeitstempel für Debug-Ausgaben
 * @returns {string} Formatierter Zeitstempel
 */
export function getTimestamp() {
    return new Date().toLocaleTimeString('de-DE');
}

/**
 * Wartet eine bestimmte Zeit (async/await-kompatibel)
 * @param {number} milliseconds - Wartezeit in Millisekunden
 * @returns {Promise} Promise das nach der Zeit aufgelöst wird
 */
export function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Konvertiert RGB-Farben zu Hex
 * @param {number} r - Rot-Wert (0-255)
 * @param {number} g - Grün-Wert (0-255) 
 * @param {number} b - Blau-Wert (0-255)
 * @returns {string} Hex-Farbcode
 */
export function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Erstellt ein einfaches Event-System
 * @returns {Object} Event-Emitter mit on, emit, off Methoden
 */
export function createEventEmitter() {
    const events = {};
    
    return {
        on(event, callback) {
            if (!events[event]) events[event] = [];
            events[event].push(callback);
        },
        
        emit(event, ...args) {
            if (events[event]) {
                events[event].forEach(callback => callback(...args));
            }
        },
        
        off(event, callback) {
            if (events[event]) {
                events[event] = events[event].filter(cb => cb !== callback);
            }
        }
    };
}

/**
 * Erweiterte Debug-Funktion für komplexe Objekte
 * @param {Object} obj - Zu debuggendes Objekt
 * @param {string} label - Label für die Ausgabe
 * @param {number} maxDepth - Maximale Verschachtelungstiefe
 */
export function debugObject(obj, label = 'Object', maxDepth = 3) {
    if (!window.gameState?.debugMode) return;
    
    console.group(`🔍 ${label}`);
    
    try {
        if (maxDepth <= 0) {
            console.log('[Max depth reached]');
            return;
        }
        
        if (Array.isArray(obj)) {
            console.log(`Array[${obj.length}]:`, obj);
        } else if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                if (value && typeof value === 'object' && maxDepth > 1) {
                    debugObject(value, key, maxDepth - 1);
                } else {
                    console.log(`${key}:`, value);
                }
            });
        } else {
            console.log(obj);
        }
    } catch (error) {
        console.error('Debug error:', error);
    } finally {
        console.groupEnd();
    }
}

/**
 * Performance-Messung für kritische Funktionen
 * @param {Function} fn - Auszuführende Funktion
 * @param {string} label - Label für die Messung
 * @returns {*} Rückgabewert der Funktion
 */
export async function measurePerformance(fn, label = 'Operation') {
    const startTime = performance.now();
    
    try {
        const result = await fn();
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (window.gameState?.debugMode && duration > 10) {
            console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
        }
        
        return result;
    } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.error(`❌ ${label} failed after ${duration.toFixed(2)}ms:`, error);
        throw error;
    }
}
