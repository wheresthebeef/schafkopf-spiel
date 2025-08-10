/**
 * Bayerisches Schafkopf - Trumpf-System
 * ES6 Module: Trumpf-Logik, Trumpf-Reihenfolge, Stechregeln
 */

/**
 * Setzt den Trumpf-Status für alle Karten im Deck
 * Ober und Unter sind immer Trumpf, dazu alle Herz-Karten  
 * @param {Array} deck - Das Kartendeck
 */
export function setTrumpStatus(deck) {
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
 * Hilfsfunktion: Findet alle Trümpfe in einem Kartenstapel  
 * @param {Array} cards - Array von Karten
 * @returns {Array} Array mit allen Trümpfen
 */
export function findTrumps(cards) {
    return cards.filter(card => card.isTrump);
}

console.log('🃏 Trump system module loaded');