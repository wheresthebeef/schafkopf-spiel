/**
 * Bayerisches Schafkopf - Deck-Management 
 * Funktionen für Kartenmischung und -verteilung
 */

import { GAME_RULES } from '../core/constants.js';
import { logGameAction } from '../core/utils.js';

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
    
    logGameAction('Karten gemischt', { cardCount: shuffled.length });
    return shuffled;
}

/**
 * Verteilt Karten an die Spieler
 * @param {Array} deck - Das gemischte Deck
 * @param {number} playerCount - Anzahl der Spieler (normalerweise 4)
 * @returns {Array} Array mit Kartenarrays für jeden Spieler
 */
export function dealCards(deck, playerCount = GAME_RULES.PLAYERS_COUNT) {
    if (deck.length !== 32) {
        throw new Error('Deck muss genau 32 Karten haben');
    }
    
    if (playerCount !== 4) {
        throw new Error('Schafkopf wird nur mit 4 Spielern gespielt');
    }
    
    const hands = Array(playerCount).fill(null).map(() => []);
    
    // 8 Karten pro Spieler verteilen
    for (let i = 0; i < deck.length; i++) {
        const playerIndex = i % playerCount;
        hands[playerIndex].push(deck[i]);
    }
    
    // Jede Hand sortieren (wird später von card-utils übernommen)
    hands.forEach(hand => {
        sortCardsForDisplay(hand);
    });
    
    logGameAction('Karten verteilt', { 
        playerCount,
        cardsPerPlayer: hands[0].length 
    });
    
    return hands;
}

/**
 * Temporäre Sortierung - wird später von card-utils übernommen
 * @param {Array} cards - Zu sortierende Karten
 */
function sortCardsForDisplay(cards) {
    return cards.sort((a, b) => {
        // Einfache Sortierung: Trümpfe zuerst, dann nach Farbe und Wert
        if (a.isTrump && !b.isTrump) return -1;
        if (!a.isTrump && b.isTrump) return 1;
        
        if (a.isTrump && b.isTrump) {
            return b.trumpOrder - a.trumpOrder;
        }
        
        if (a.suit !== b.suit) {
            return a.suit.localeCompare(b.suit);
        }
        
        return b.order - a.order;
    });
}

/**
 * Erstellt eine neue gemischte und verteilte Kartenrunde
 * @param {Array} baseDeck - Das Basis-Kartendeck
 * @param {string} gameType - Spieltyp für Trumpf-Bestimmung
 * @param {string} soloSuit - Solo-Farbe (falls relevant)
 * @returns {Object} { shuffledDeck, hands }
 */
export function prepareNewRound(baseDeck, gameType = 'rufspiel', soloSuit = null) {
    // Deck kopieren und Trumpf-Status setzen
    const deckCopy = baseDeck.map(card => ({ ...card }));
    
    // Trumpf-Status wird vom cards-Modul gesetzt
    if (typeof window !== 'undefined' && window.setTrumpStatus) {
        window.setTrumpStatus(deckCopy, gameType, soloSuit);
    }
    
    // Mischen und verteilen
    const shuffledDeck = shuffleDeck(deckCopy);
    const hands = dealCards(shuffledDeck);
    
    return {
        shuffledDeck,
        hands
    };
}

/**
 * Validiert die Kartenverteilung
 * @param {Array} hands - Array der Spielerhände
 * @returns {Object} Validierungsergebnis
 */
export function validateCardDistribution(hands) {
    const result = {
        valid: true,
        errors: []
    };
    
    // Prüfe Anzahl Spieler
    if (hands.length !== 4) {
        result.valid = false;
        result.errors.push(`Falsche Anzahl Spieler: ${hands.length} statt 4`);
    }
    
    // Prüfe Karten pro Spieler
    hands.forEach((hand, index) => {
        if (hand.length !== 8) {
            result.valid = false;
            result.errors.push(`Spieler ${index} hat ${hand.length} statt 8 Karten`);
        }
    });
    
    // Prüfe auf doppelte Karten
    const allCards = hands.flat();
    const cardIds = allCards.map(card => card.id);
    const uniqueIds = new Set(cardIds);
    
    if (uniqueIds.size !== cardIds.length) {
        result.valid = false;
        result.errors.push('Doppelte Karten in der Verteilung gefunden');
    }
    
    // Prüfe Gesamtanzahl
    if (allCards.length !== 32) {
        result.valid = false;
        result.errors.push(`Gesamtanzahl Karten: ${allCards.length} statt 32`);
    }
    
    return result;
}

/**
 * Erstellt Statistiken über die Kartenverteilung
 * @param {Array} hands - Array der Spielerhände
 * @returns {Object} Verteilungsstatistiken
 */
export function analyzeCardDistribution(hands) {
    const stats = {
        players: [],
        totalTrumps: 0,
        totalPoints: 0,
        balanceScore: 0 // 0 = perfekt ausgewogen, höher = unausgewogen
    };
    
    hands.forEach((hand, index) => {
        const trumps = hand.filter(card => card.isTrump);
        const points = hand.reduce((sum, card) => sum + card.points, 0);
        const aces = hand.filter(card => card.value === 'sau');
        
        const playerStats = {
            playerIndex: index,
            cardCount: hand.length,
            trumpCount: trumps.length,
            points: points,
            aces: aces.length,
            suitDistribution: {
                eichel: hand.filter(c => c.suit === 'eichel' && !c.isTrump).length,
                gras: hand.filter(c => c.suit === 'gras' && !c.isTrump).length,
                herz: hand.filter(c => c.suit === 'herz' && !c.isTrump).length,
                schellen: hand.filter(c => c.suit === 'schellen' && !c.isTrump).length
            }
        };
        
        stats.players.push(playerStats);
        stats.totalTrumps += trumps.length;
        stats.totalPoints += points;
    });
    
    // Berechne Balance-Score (Standardabweichung der Trumpf-Verteilung)
    const avgTrumps = stats.totalTrumps / 4;
    const trumpVariance = stats.players.reduce((sum, p) => {
        return sum + Math.pow(p.trumpCount - avgTrumps, 2);
    }, 0) / 4;
    stats.balanceScore = Math.sqrt(trumpVariance);
    
    return stats;
}

/**
 * Simuliert mehrere Kartenverteilungen und gibt Statistiken zurück
 * @param {Array} baseDeck - Das Basis-Kartendeck
 * @param {number} iterations - Anzahl Simulationen
 * @returns {Object} Aggregierte Statistiken
 */
export function simulateDistributions(baseDeck, iterations = 1000) {
    const results = {
        averageTrumpDistribution: [0, 0, 0, 0],
        averagePointDistribution: [0, 0, 0, 0],
        balanceScores: [],
        extremeDistributions: []
    };
    
    for (let i = 0; i < iterations; i++) {
        const { hands } = prepareNewRound(baseDeck);
        const stats = analyzeCardDistribution(hands);
        
        // Sammle Daten
        stats.players.forEach((player, index) => {
            results.averageTrumpDistribution[index] += player.trumpCount;
            results.averagePointDistribution[index] += player.points;
        });
        
        results.balanceScores.push(stats.balanceScore);
        
        // Markiere extreme Verteilungen
        if (stats.balanceScore > 2.0) {
            results.extremeDistributions.push({
                iteration: i,
                balanceScore: stats.balanceScore,
                distribution: stats.players.map(p => ({
                    trumps: p.trumpCount,
                    points: p.points
                }))
            });
        }
    }
    
    // Berechne Durchschnitte
    results.averageTrumpDistribution = results.averageTrumpDistribution.map(sum => sum / iterations);
    results.averagePointDistribution = results.averagePointDistribution.map(sum => sum / iterations);
    
    results.averageBalanceScore = results.balanceScores.reduce((a, b) => a + b, 0) / iterations;
    results.extremeDistributionRate = results.extremeDistributions.length / iterations;
    
    return results;
}

// Legacy-Kompatibilität
if (typeof window !== 'undefined') {
    window.shuffleDeck = shuffleDeck;
    window.dealCards = dealCards;
    window.prepareNewRound = prepareNewRound;
    window.validateCardDistribution = validateCardDistribution;
    window.analyzeCardDistribution = analyzeCardDistribution;
}
