/**
 * Bayerisches Schafkopf - Karten-Utilities
 * Hilfsfunktionen für Kartenvergleich, Sortierung und Manipulation
 */

import { findTrumps, findNonTrumps } from './cards.js';

/**
 * Sortiert Karten nach Schafkopf-Regeln für die Anzeige
 * Reihenfolge: Alle Ober (Eichel,Gras,Herz,Schelle), Alle Unter (Eichel,Gras,Herz,Schelle), 
 * Trumpf-Farben-Karten, andere Farben alphabetisch
 * @param {Array} cards - Array von Karten
 * @returns {Array} Sortierte Karten
 */
export function sortCardsForDisplay(cards) {
    return cards.sort((a, b) => {
        // Definiere Anzeige-Prioritäten
        const getDisplayPriority = (card) => {
            // Ober haben höchste Priorität (100-110)
            if (card.value === 'ober') {
                switch (card.suit) {
                    case 'eichel': return 104;
                    case 'gras': return 103;
                    case 'herz': return 102;
                    case 'schellen': return 101;
                }
            }
            
            // Unter haben zweithöchste Priorität (90-99)
            if (card.value === 'unter') {
                switch (card.suit) {
                    case 'eichel': return 94;
                    case 'gras': return 93;
                    case 'herz': return 92;
                    case 'schellen': return 91;
                }
            }
            
            // Trumpf-Farben-Karten (außer Ober/Unter) haben Priorität 70-79
            if (card.isTrump) {
                return 70 + card.order;
            }
            
            // Andere Farben: Eichel(60-69), Gras(40-49), Herz(30-39), Schellen(20-29)
            let basePriority = 0;
            switch (card.suit) {
                case 'eichel': basePriority = 60; break;
                case 'gras': basePriority = 40; break;
                case 'herz': basePriority = 30; break;
                case 'schellen': basePriority = 20; break;
            }
            
            return basePriority + card.order;
        };
        
        return getDisplayPriority(b) - getDisplayPriority(a);
    });
}

/**
 * Sortiert Karten nach Schafkopf-Regeln für die Spiellogik
 * Trümpfe zuerst (nach Trumpf-Reihenfolge), dann Farben alphabetisch
 * @param {Array} cards - Array von Karten
 * @returns {Array} Sortierte Karten
 */
export function sortCards(cards) {
    return cards.sort((a, b) => {
        // Beide Trumpf: nach Trumpf-Reihenfolge sortieren
        if (a.isTrump && b.isTrump) {
            return b.trumpOrder - a.trumpOrder;
        }
        
        // Nur a ist Trumpf: a kommt zuerst
        if (a.isTrump && !b.isTrump) {
            return -1;
        }
        
        // Nur b ist Trumpf: b kommt zuerst
        if (!a.isTrump && b.isTrump) {
            return 1;
        }
        
        // Beide keine Trümpfe: erst nach Farbe, dann nach Wert sortieren
        if (a.suit !== b.suit) {
            return a.suit.localeCompare(b.suit);
        }
        
        return b.order - a.order;
    });
}

/**
 * Analysiert die Stärke einer Kartenhand
 * @param {Array} cards - Kartenhand
 * @returns {Object} Handbewertung
 */
export function evaluateHand(cards) {
    const trumps = findTrumps(cards);
    const nonTrumps = findNonTrumps(cards);
    
    // Farben-Verteilung analysieren
    const suitDistribution = {
        eichel: cards.filter(c => c.suit === 'eichel' && !c.isTrump),
        gras: cards.filter(c => c.suit === 'gras' && !c.isTrump),
        herz: cards.filter(c => c.suit === 'herz' && !c.isTrump),
        schellen: cards.filter(c => c.suit === 'schellen' && !c.isTrump)
    };
    
    const totalPoints = cards.reduce((sum, card) => sum + card.points, 0);
    const highTrumps = trumps.filter(c => c.trumpOrder >= 15).length; // Ober
    const longSuits = Object.values(suitDistribution).filter(suit => suit.length >= 4);
    const shortSuits = Object.values(suitDistribution).filter(suit => suit.length <= 1);
    
    return {
        trumpCount: trumps.length,
        highTrumps: highTrumps,
        totalPoints: totalPoints,
        longSuits: longSuits.length,
        shortSuits: shortSuits.length,
        suitDistribution: {
            eichel: suitDistribution.eichel.length,
            gras: suitDistribution.gras.length,
            herz: suitDistribution.herz.length,
            schellen: suitDistribution.schellen.length
        },
        strength: calculateHandStrength(trumps.length, highTrumps, totalPoints),
        playableAces: getPlayableAces(cards),
        runnableColors: getRunnableColors(cards)
    };
}

/**
 * Berechnet die Stärke einer Hand (0-100)
 * @param {number} trumpCount - Anzahl Trümpfe
 * @param {number} highTrumps - Anzahl hohe Trümpfe (Ober)
 * @param {number} totalPoints - Gesamtpunkte
 * @returns {number} Handstärke (0-100)
 */
function calculateHandStrength(trumpCount, highTrumps, totalPoints) {
    let strength = 0;
    
    // Trumpf-Bewertung (max 40 Punkte)
    strength += trumpCount * 4;
    strength += highTrumps * 6;
    
    // Punkte-Bewertung (max 30 Punkte)
    strength += Math.min(totalPoints, 60) / 2;
    
    // Bonus für sehr starke Hände
    if (trumpCount >= 6) strength += 10;
    if (highTrumps >= 3) strength += 10;
    if (totalPoints >= 80) strength += 10;
    
    return Math.min(strength, 100);
}

/**
 * Ermittelt rufbare Asse für Rufspiel
 * @param {Array} cards - Spielerkarten
 * @returns {Array} Array mit rufbaren Assen
 */
function getPlayableAces(cards) {
    const playableAces = [];
    const callableSuits = ['eichel', 'gras', 'schellen']; // Herz ist Trumpf
    
    callableSuits.forEach(suit => {
        // Prüfen ob Spieler selbst das Ass hat
        const hasAce = cards.some(card => 
            card.suit === suit && card.value === 'sau'
        );
        
        if (hasAce) return; // Eigenes Ass kann nicht gerufen werden
        
        // Prüfen ob Spieler mindestens eine Karte der Farbe hat (außer Ober/Unter)
        const hasSuitCard = cards.some(card => 
            card.suit === suit && 
            card.value !== 'ober' && 
            card.value !== 'unter'
        );
        
        if (hasSuitCard) {
            playableAces.push({
                suit: suit,
                name: `${suit.charAt(0).toUpperCase() + suit.slice(1)}-Ass`,
                suitCards: cards.filter(c => c.suit === suit && !c.isTrump).length
            });
        }
    });
    
    return playableAces;
}

/**
 * Ermittelt Farben bei denen "davongelaufen" werden kann
 * @param {Array} cards - Spielerkarten
 * @returns {Array} Array mit davonlauffähigen Farben
 */
function getRunnableColors(cards) {
    const runnableColors = [];
    const suits = ['eichel', 'gras', 'herz', 'schellen'];
    
    suits.forEach(suit => {
        const suitCards = cards.filter(c => c.suit === suit && !c.isTrump);
        if (suitCards.length >= 4) {
            runnableColors.push({
                suit: suit,
                cardCount: suitCards.length,
                hasAce: suitCards.some(c => c.value === 'sau')
            });
        }
    });
    
    return runnableColors;
}

/**
 * Ermittelt die beste Karte zum Ausspielen basierend auf Hand-Analyse
 * @param {Array} cards - Verfügbare Karten
 * @param {Object} handEvaluation - Handbewertung
 * @param {string} strategy - Spielstrategie ('aggressive', 'defensive', 'balanced')
 * @returns {Object} Empfohlene Karte
 */
export function recommendLeadCard(cards, handEvaluation, strategy = 'balanced') {
    if (cards.length === 0) return null;
    
    const trumps = cards.filter(c => c.isTrump);
    const nonTrumps = cards.filter(c => !c.isTrump);
    
    switch (strategy) {
        case 'aggressive':
            // Hohe Trümpfe oder Asse ausspielen
            const highTrumps = trumps.filter(c => c.trumpOrder >= 15);
            if (highTrumps.length > 0) return highTrumps[0];
            
            const aces = nonTrumps.filter(c => c.value === 'sau');
            if (aces.length > 0) return aces[0];
            break;
            
        case 'defensive':
            // Niedrige Karten oder kurze Farben ausspielen
            const shortSuitCards = nonTrumps.filter(c => {
                const suitCount = cards.filter(card => card.suit === c.suit && !card.isTrump).length;
                return suitCount <= 2;
            });
            if (shortSuitCards.length > 0) {
                return shortSuitCards.reduce((lowest, card) => 
                    card.points < lowest.points ? card : lowest
                );
            }
            break;
            
        case 'balanced':
        default:
            // Mittlere Trümpfe oder mittlere Farbkarten
            if (trumps.length >= 4) {
                const midTrumps = trumps.filter(c => c.trumpOrder < 15 && c.trumpOrder > 5);
                if (midTrumps.length > 0) return midTrumps[0];
            }
            
            // Mittlere Farbkarten
            const midCards = nonTrumps.filter(c => c.points > 0 && c.points < 10);
            if (midCards.length > 0) return midCards[0];
            break;
    }
    
    // Fallback: Erste spielbare Karte
    return cards[0];
}

/**
 * Ermittelt die beste Karte zum Bedienen basierend auf Stich-Situation
 * @param {Array} playableCards - Spielbare Karten
 * @param {Array} currentTrick - Aktueller Stich
 * @param {boolean} canWin - Kann der Stich gewonnen werden
 * @param {boolean} isTeammate - Führt ein Teammitglied
 * @returns {Object} Empfohlene Karte
 */
export function recommendFollowCard(playableCards, currentTrick, canWin, isTeammate) {
    if (playableCards.length === 0) return null;
    if (playableCards.length === 1) return playableCards[0];
    
    const trickPoints = currentTrick.reduce((sum, tc) => sum + tc.card.points, 0);
    const winningCards = playableCards.filter(c => canWinTrick(c, currentTrick));
    
    if (canWin && winningCards.length > 0) {
        if (isTeammate) {
            // Partner führt: nur bei vielen Punkten übernehmen
            if (trickPoints >= 20) {
                return getLowestWinningCard(winningCards);
            } else {
                return getHighestSchmierCard(playableCards);
            }
        } else {
            // Gegner führt: immer stechen wenn möglich
            return getLowestWinningCard(winningCards);
        }
    } else {
        // Kann nicht stechen
        if (isTeammate) {
            // Partner gewinnt: schmieren
            return getHighestSchmierCard(playableCards);
        } else {
            // Gegner gewinnt: niedrig abwerfen
            return getLowestCard(playableCards);
        }
    }
}

/**
 * Prüft ob eine Karte einen Stich gewinnen kann
 * @param {Object} card - Zu prüfende Karte
 * @param {Array} currentTrick - Aktueller Stich
 * @returns {boolean} true wenn Karte gewinnt
 */
function canWinTrick(card, currentTrick) {
    if (currentTrick.length === 0) return true;
    
    let highestCard = currentTrick[0].card;
    for (let i = 1; i < currentTrick.length; i++) {
        if (window.isCardHigher && window.isCardHigher(currentTrick[i].card, highestCard)) {
            highestCard = currentTrick[i].card;
        }
    }
    
    return window.isCardHigher && window.isCardHigher(card, highestCard);
}

/**
 * Ermittelt die niedrigste Karte die den Stich gewinnt
 * @param {Array} winningCards - Karten die gewinnen können
 * @returns {Object} Niedrigste gewinnende Karte
 */
function getLowestWinningCard(winningCards) {
    return winningCards.reduce((lowest, card) => {
        if (card.isTrump && lowest.isTrump) {
            return card.trumpOrder < lowest.trumpOrder ? card : lowest;
        }
        if (card.isTrump !== lowest.isTrump) {
            return !card.isTrump ? card : lowest;
        }
        return card.order < lowest.order ? card : lowest;
    });
}

/**
 * Ermittelt die beste Karte zum Schmieren
 * @param {Array} cards - Verfügbare Karten
 * @returns {Object} Beste Schmier-Karte
 */
function getHighestSchmierCard(cards) {
    // Keine Asse wegschmieren in den ersten Stichen
    const currentTrick = window.gameState?.trickNumber || 0;
    const avoidAces = currentTrick < 3;
    
    let candidates = cards;
    if (avoidAces) {
        const nonAces = cards.filter(card => card.value !== 'sau');
        if (nonAces.length > 0) {
            candidates = nonAces;
        }
    }
    
    return candidates.reduce((highest, card) => 
        card.points > highest.points ? card : highest
    );
}

/**
 * Ermittelt die niedrigste Karte
 * @param {Array} cards - Verfügbare Karten
 * @returns {Object} Niedrigste Karte
 */
function getLowestCard(cards) {
    return cards.reduce((lowest, card) => 
        card.points < lowest.points ? card : lowest
    );
}

/**
 * Ermittelt "laufende" Trümpfe (aufeinanderfolgende höchste Trümpfe)
 * @param {Array} cards - Karten einer Partei
 * @param {string} gameType - Spieltyp
 * @returns {Object} { count, cards, isContiguous }
 */
export function calculateLaufende(cards, gameType = 'rufspiel') {
    const trumps = findTrumps(cards).sort((a, b) => b.trumpOrder - a.trumpOrder);
    
    if (trumps.length === 0) {
        return { count: 0, cards: [], isContiguous: false };
    }
    
    // Definiere höchste mögliche Trumpf-Reihenfolge basierend auf Spieltyp
    let maxTrumpOrder;
    switch (gameType) {
        case 'rufspiel':
        case 'farbsolo':
            maxTrumpOrder = 18; // Eichel-Ober
            break;
        case 'wenz':
            maxTrumpOrder = 4;  // Eichel-Unter
            break;
        default:
            maxTrumpOrder = 18;
    }
    
    // Prüfe ob mit höchstem Trumpf begonnen wird
    if (trumps[0].trumpOrder !== maxTrumpOrder) {
        return { count: 0, cards: [], isContiguous: false };
    }
    
    // Zähle aufeinanderfolgende Trümpfe
    let count = 1;
    let expectedOrder = maxTrumpOrder - 1;
    
    for (let i = 1; i < trumps.length; i++) {
        if (trumps[i].trumpOrder === expectedOrder) {
            count++;
            expectedOrder--;
        } else {
            break;
        }
    }
    
    return {
        count: count >= 3 ? count : 0, // Mindestens 3 für "laufende"
        cards: trumps.slice(0, count),
        isContiguous: true
    };
}

/**
 * Bewertet eine Kartenhand für verschiedene Spieltypen
 * @param {Array} cards - Kartenhand
 * @returns {Object} Bewertungen für jeden Spieltyp
 */
export function evaluateHandForGameTypes(cards) {
    const baseEval = evaluateHand(cards);
    
    return {
        rufspiel: {
            strength: baseEval.strength,
            playableAces: baseEval.playableAces,
            recommendation: baseEval.playableAces.length > 0 ? 'spielen' : 'weiter'
        },
        
        wenz: {
            strength: calculateWenzStrength(cards),
            unterCount: cards.filter(c => c.value === 'unter').length,
            recommendation: cards.filter(c => c.value === 'unter').length >= 2 ? 'spielen' : 'weiter'
        },
        
        farbsolo: evaluateFarbsoloOptions(cards)
    };
}

/**
 * Berechnet die Stärke für Wenz
 * @param {Array} cards - Kartenhand
 * @returns {number} Wenz-Stärke (0-100)
 */
function calculateWenzStrength(cards) {
    const unter = cards.filter(c => c.value === 'unter');
    const nonTrumps = cards.filter(c => c.value !== 'unter');
    const points = cards.reduce((sum, card) => sum + card.points, 0);
    
    let strength = 0;
    
    // Unter-Bewertung (max 40 Punkte)
    strength += unter.length * 10;
    
    // Hohe Unter extra bewerten
    const highUnter = unter.filter(u => ['eichel', 'gras'].includes(u.suit));
    strength += highUnter.length * 5;
    
    // Punkte-Bewertung
    strength += Math.min(points, 80) / 4;
    
    // Asse bewerten
    const aces = nonTrumps.filter(c => c.value === 'sau');
    strength += aces.length * 5;
    
    return Math.min(strength, 100);
}

/**
 * Bewertet Farb-Solo-Optionen
 * @param {Array} cards - Kartenhand
 * @returns {Object} Bewertung aller Solo-Farben
 */
function evaluateFarbsoloOptions(cards) {
    const suits = ['eichel', 'gras', 'herz', 'schellen'];
    const soloOptions = {};
    
    suits.forEach(suit => {
        const suitCards = cards.filter(c => c.suit === suit && !['ober', 'unter'].includes(c.value));
        const ober = cards.filter(c => c.value === 'ober');
        const unter = cards.filter(c => c.value === 'unter');
        const totalTrumps = ober.length + unter.length + suitCards.length;
        
        let strength = 0;
        strength += totalTrumps * 8;
        strength += ober.length * 10;
        strength += unter.length * 8;
        
        if (suitCards.some(c => c.value === 'sau')) strength += 15;
        if (suitCards.some(c => c.value === 'zehn')) strength += 10;
        
        soloOptions[suit] = {
            strength: Math.min(strength, 100),
            trumpCount: totalTrumps,
            recommendation: strength >= 60 ? 'spielen' : 'weiter'
        };
    });
    
    return soloOptions;
}

// Legacy-Kompatibilität
if (typeof window !== 'undefined') {
    window.sortCardsForDisplay = sortCardsForDisplay;
    window.sortCards = sortCards;
    window.evaluateHand = evaluateHand;
    window.recommendLeadCard = recommendLeadCard;
    window.recommendFollowCard = recommendFollowCard;
    window.calculateLaufende = calculateLaufende;
    window.evaluateHandForGameTypes = evaluateHandForGameTypes;
}
