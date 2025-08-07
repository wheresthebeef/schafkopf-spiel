/**
 * Bayerisches Schafkopf - Kartendefinitionen
 * Grundlegende Kartendaten und -strukturen
 */

import { SUITS, VALUES, TRUMP_ORDERS } from '../core/constants.js';
import { createCardId } from '../core/utils.js';

/**
 * Erstellt ein vollständiges Kartendeck (32 Karten)
 * @returns {Array} Array mit allen Kartenobjekten
 */
export function createDeck() {
    const deck = [];
    
    for (let suitKey in SUITS) {
        for (let valueKey in VALUES) {
            const suit = SUITS[suitKey];
            const value = VALUES[valueKey];
            
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
                id: createCardId(suitKey, valueKey)
            });
        }
    }
    
    return deck;
}

/**
 * Setzt den Trumpf-Status für alle Karten basierend auf Spieltyp
 * @param {Array} deck - Das Kartendeck
 * @param {string} gameType - Spieltyp ('rufspiel', 'wenz', 'farbsolo')
 * @param {string} soloSuit - Bei Farb-Solo: die Trumpf-Farbe
 */
export function setTrumpStatus(deck, gameType = 'rufspiel', soloSuit = null) {
    // Alle Karten erstmal als Nicht-Trumpf markieren
    deck.forEach(card => {
        card.isTrump = false;
        card.trumpOrder = 0;
    });
    
    switch (gameType) {
        case 'rufspiel':
            setRufspielTrumps(deck);
            break;
            
        case 'wenz':
            setWenzTrumps(deck);
            break;
            
        case 'farbsolo':
            setFarbsoloTrumps(deck, soloSuit);
            break;
            
        default:
            console.warn('Unbekannter Spieltyp für Trumpf-Status:', gameType);
            setRufspielTrumps(deck); // Fallback
    }
}

/**
 * Setzt Trümpfe für Rufspiel (Standard)
 * @param {Array} deck - Das Kartendeck
 */
function setRufspielTrumps(deck) {
    deck.forEach(card => {
        const cardKey = `${card.suit}_${card.value}`;
        
        if (TRUMP_ORDERS.RUFSPIEL[cardKey] !== undefined) {
            card.isTrump = true;
            card.trumpOrder = TRUMP_ORDERS.RUFSPIEL[cardKey];
        }
    });
}

/**
 * Setzt Trümpfe für Wenz (nur Unter)
 * @param {Array} deck - Das Kartendeck
 */
function setWenzTrumps(deck) {
    deck.forEach(card => {
        const cardKey = `${card.suit}_${card.value}`;
        
        if (TRUMP_ORDERS.WENZ[cardKey] !== undefined) {
            card.isTrump = true;
            card.trumpOrder = TRUMP_ORDERS.WENZ[cardKey];
        }
    });
}

/**
 * Setzt Trümpfe für Farb-Solo
 * @param {Array} deck - Das Kartendeck
 * @param {string} trumpSuit - Die Trumpf-Farbe
 */
function setFarbsoloTrumps(deck, trumpSuit) {
    if (!trumpSuit) {
        console.error('Keine Trumpf-Farbe für Farb-Solo angegeben');
        return;
    }
    
    deck.forEach(card => {
        // Ober und Unter sind immer Trümpfe (wie bei Rufspiel)
        if (card.value === 'ober') {
            card.isTrump = true;
            switch (card.suit) {
                case 'eichel': card.trumpOrder = 18; break;
                case 'gras': card.trumpOrder = 17; break;
                case 'herz': card.trumpOrder = 16; break;
                case 'schellen': card.trumpOrder = 15; break;
            }
        } else if (card.value === 'unter') {
            card.isTrump = true;
            switch (card.suit) {
                case 'eichel': card.trumpOrder = 14; break;
                case 'gras': card.trumpOrder = 13; break;
                case 'herz': card.trumpOrder = 12; break;
                case 'schellen': card.trumpOrder = 11; break;
            }
        }
        // Karten der Solo-Trumpf-Farbe (außer Ober/Unter)
        else if (card.suit === trumpSuit) {
            card.isTrump = true;
            // Solo-Trumpf-Reihenfolge: Ass(10), Zehn(9), König(8), etc.
            card.trumpOrder = card.order - 4;
        }
    });
}

/**
 * Prüft ob eine Karte höher ist als eine andere
 * @param {Object} card1 - Erste Karte
 * @param {Object} card2 - Zweite Karte (Referenzkarte)
 * @returns {boolean} true wenn card1 höher ist
 */
export function isCardHigher(card1, card2) {
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
export function findCard(cards, suit, value) {
    return cards.find(card => card.suit === suit && card.value === value) || null;
}

/**
 * Entfernt eine Karte aus einem Array
 * @param {Array} cards - Array von Karten
 * @param {string} suit - Farbe der zu entfernenden Karte
 * @param {string} value - Wert der zu entfernenden Karte
 * @returns {Object|null} Die entfernte Karte oder null
 */
export function removeCard(cards, suit, value) {
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
export function countPoints(cards) {
    return cards.reduce((sum, card) => sum + card.points, 0);
}

/**
 * Hilfsfunktionen für Kartensuche
 */
export function findAces(cards) {
    return cards.filter(card => card.value === 'sau');
}

export function findTrumps(cards) {
    return cards.filter(card => card.isTrump);
}

export function findSuitCards(cards, suit) {
    return cards.filter(card => card.suit === suit && !card.isTrump);
}

export function findNonTrumps(cards) {
    return cards.filter(card => !card.isTrump);
}

/**
 * Validiert ein Kartendeck auf Vollständigkeit
 * @param {Array} deck - Das zu prüfende Deck
 * @returns {Object} Validierungsergebnis
 */
export function validateDeck(deck) {
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
    
    // Punkte prüfen
    const totalPoints = countPoints(deck);
    if (totalPoints !== 120) {
        result.valid = false;
        result.errors.push(`Falsche Gesamtpunkte: ${totalPoints} statt 120`);
    }
    
    // Duplikate prüfen
    const deckIds = deck.map(card => card.id);
    const duplicates = deckIds.filter((id, index) => deckIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
        result.valid = false;
        result.errors.push(`Doppelte Karten: ${duplicates.join(', ')}`);
    }
    
    return result;
}

/**
 * Debug-Funktion: Zeigt die komplette Trumpf-Reihenfolge an
 * @param {Array} deck - Das Kartendeck
 */
export function debugTrumpOrder(deck) {
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
export function debugCards(cards, label = 'Karten') {
    console.log(`${label}:`, cards.map(card => 
        `${card.symbol}${card.short}${card.isTrump ? '(T)' : ''}`
    ).join(' '));
}

// Legacy-Kompatibilität: Globale Verfügbarkeit für bestehenden Code
if (typeof window !== 'undefined') {
    window.createDeck = createDeck;
    window.setTrumpStatus = setTrumpStatus;
    window.isCardHigher = isCardHigher;
    window.findCard = findCard;
    window.removeCard = removeCard;
    window.countPoints = countPoints;
    window.findAces = findAces;
    window.findTrumps = findTrumps;
    window.findSuitCards = findSuitCards;
    window.validateDeck = validateDeck;
    window.debugTrumpOrder = debugTrumpOrder;
    window.debugCards = debugCards;
}
