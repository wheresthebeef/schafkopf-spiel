/**
 * Bayerisches Schafkopf - Deck-Operationen
 * ES6 Module: Deck-Erstellung, Mischen, Verteilen
 */

import { suits, values, createCard } from './card-definitions.js';
import { setTrumpStatus } from './trump-system.js';

/**
 * Erstellt ein vollständiges Kartendeck (32 Karten)
 * @returns {Array} Array mit allen Kartenobjekten
 */
export function createDeck() {
    const deck = [];
    
    for (let suitKey in suits) {
        for (let valueKey in values) {
            deck.push(createCard(suitKey, valueKey));
        }
    }
    
    // Trumpf-Status setzen
    setTrumpStatus(deck);
    
    return deck;
}

/**
 * Mischt ein Kartendeck (Fisher-Yates Algorithmus)
 * @param {Array} deck - Das zu mischende Deck
 * @returns {Array} Das gemischte Deck
 */
export function shuffleDeck(deck) {
    const shuffled = [...deck]; // Kopie erstellen
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}

/**
 * Verteilt Karten an die Spieler
 * @param {Array} deck - Das gemischte Deck
 * @param {number} playerCount - Anzahl der Spieler (normalerweise 4)
 * @returns {Array} Array mit Kartenarrays für jeden Spieler
 */
export function dealCards(deck, playerCount = 4) {
    const hands = Array(playerCount).fill(null).map(() => []);
    
    // 8 Karten pro Spieler
    for (let i = 0; i < deck.length; i++) {
        const playerIndex = i % playerCount;
        hands[playerIndex].push(deck[i]);
    }
    
    return hands;
}

/**
 * Validiert ein Kartendeck auf Vollständigkeit und Korrektheit
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
    const totalPoints = deck.reduce((sum, card) => sum + card.points, 0);
    if (totalPoints !== 120) {
        result.valid = false;
        result.errors.push(`Falsche Gesamtpunkte: ${totalPoints} statt 120`);
    }
    
    return result;
}

console.log('🃏 Deck operations module loaded');