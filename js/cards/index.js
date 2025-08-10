/**
 * Bayerisches Schafkopf - Cards Module Index
 * ES6 Module: Hauptexport für das gesamte Kartensystem
 */

// Import aller Card-Module
import { suits, values, createCard, CARD_CONSTANTS } from './card-definitions.js';
import { createDeck, shuffleDeck, dealCards, validateDeck } from './deck-operations.js';
import { setTrumpStatus, isCardHigher, debugTrumpOrder, findTrumps } from './trump-system.js';
import { sortCards, sortCardsForDisplay } from './card-sorting.js';
import { 
    findCard, 
    removeCard, 
    countPoints, 
    findAces, 
    findSuitCards, 
    debugCards, 
    debugCardsDetailed,
    cardsEqual,
    copyCard,
    copyCards 
} from './card-utilities.js';

// Re-export alles für einfache Verwendung
export {
    // Definitionen
    suits,
    values,
    createCard,
    CARD_CONSTANTS,
    
    // Deck-Operationen
    createDeck,
    shuffleDeck,
    dealCards,
    validateDeck,
    
    // Trumpf-System
    setTrumpStatus,
    isCardHigher,
    debugTrumpOrder,
    findTrumps,
    
    // Sortierung
    sortCards,
    sortCardsForDisplay,
    
    // Hilfsfunktionen
    findCard,
    removeCard,
    countPoints,
    findAces,
    findSuitCards,
    debugCards,
    debugCardsDetailed,
    cardsEqual,
    copyCard,
    copyCards
};

// Einfache Test-Funktion für das Kartensystem
export function testCardSystem() {
    console.log('🧪 Testing Card System...');
    
    const deck = createDeck();
    const validation = validateDeck(deck);
    
    console.log('✅ Deck created:', deck.length, 'cards');
    console.log('✅ Validation:', validation.valid ? 'PASSED' : 'FAILED');
    
    if (!validation.valid) {
        console.error('❌ Validation errors:', validation.errors);
    }
    
    const shuffled = shuffleDeck(deck);
    const hands = dealCards(shuffled);
    
    console.log('✅ Cards dealt to', hands.length, 'players');
    hands.forEach((hand, index) => {
        debugCards(hand, `Player ${index + 1}`);
    });
    
    console.log('🧪 Card System test complete');
    return { deck, hands, validation };
}

console.log('🃏 Cards module index loaded - all card functions available');
console.log('📋 Available functions:', Object.keys({
    suits, values, createCard, createDeck, shuffleDeck, dealCards,
    setTrumpStatus, isCardHigher, sortCards, sortCardsForDisplay,
    findCard, removeCard, countPoints, findAces, findSuitCards,
    debugCards, testCardSystem
}).join(', '));