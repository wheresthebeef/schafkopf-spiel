/**
 * Bayerisches Schafkopf - Karten-Hilfsfunktionen
 * ES6 Module: Suchen, Entfernen, Zählen, Debugging
 */

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
 * Hilfsfunktion: Findet alle Asse in einem Kartenstapel
 * @param {Array} cards - Array von Karten
 * @returns {Array} Array mit allen Assen
 */
export function findAces(cards) {
    return cards.filter(card => card.value === 'sau');
}

/**
 * Hilfsfunktion: Findet alle Karten einer bestimmten Farbe (ohne Trümpfe)
 * @param {Array} cards - Array von Karten
 * @param {string} suit - Gesuchte Farbe
 * @returns {Array} Array mit Karten der Farbe
 */
export function findSuitCards(cards, suit) {
    return cards.filter(card => card.suit === suit && !card.isTrump);
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

/**
 * Erweiterte Debug-Funktion: Zeigt detaillierte Karteninformationen
 * @param {Array} cards - Array von Karten
 * @param {string} label - Label für die Ausgabe
 */
export function debugCardsDetailed(cards, label = 'Karten') {
    console.log(`=== ${label.toUpperCase()} ===`);
    cards.forEach((card, index) => {
        console.log(`${index + 1}. ${card.symbol}${card.short} - ${card.name} (${card.points}P${card.isTrump ? ', T:' + card.trumpOrder : ''})`);
    });
    console.log(`Gesamt: ${cards.length} Karten, ${countPoints(cards)} Punkte`);
    console.log('========================');
}

/**
 * Prüft ob zwei Karten identisch sind
 * @param {Object} card1 - Erste Karte
 * @param {Object} card2 - Zweite Karte
 * @returns {boolean} true wenn identisch
 */
export function cardsEqual(card1, card2) {
    return card1.suit === card2.suit && card1.value === card2.value;
}

/**
 * Erstellt eine Kopie einer Karte
 * @param {Object} card - Zu kopierende Karte
 * @returns {Object} Kartenkopie
 */
export function copyCard(card) {
    return { ...card };
}

/**
 * Erstellt Kopien eines Kartenarrays
 * @param {Array} cards - Zu kopierendes Kartenarray
 * @returns {Array} Array-Kopie mit Kartenkopien
 */
export function copyCards(cards) {
    return cards.map(card => copyCard(card));
}

console.log('🃏 Card utilities module loaded');