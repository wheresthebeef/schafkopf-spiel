/**
 * Bayerisches Schafkopf - Card Memory System
 * Intelligentes Kartengedächtnis für AI-Strategien
 * Verfolgt gespielte Karten und schätzt Wahrscheinlichkeiten
 * Browser-Script Version (ohne ES6 exports)
 */

/**
 * Erweiterte Kartengedächtnis-Klasse
 * Optimiert für Schafkopf-spezifische Strategien
 */
class SchafkopfCardMemory {
    constructor() {
        // Gespielte Karten
        this.playedCards = new Set();
        this.cardsByPlayer = new Map(); // playerId -> [{card, trick, position}]
        
        // Trick-Historie
        this.trickHistory = [];
        this.currentTrick = null;
        
        // Wahrscheinlichkeits-Analysen
        this.suitCounts = new Map(); // suit -> player -> count
        this.trumpCounts = new Map(); // playerId -> trump count estimate
        this.partnershipClues = new Map(); // playerId -> partnership indicators
        
        // Spielmodus-spezifische Daten
        this.gameMode = 'rufspiel';
        this.calledAce = null;
        this.partnerRevealed = false;
        
        console.log('🧠 Schafkopf Card Memory initialisiert');
    }
    
    /**
     * 🛡️ FIXED: Hauptfunktion mit robuster Null-Check Logic
     */
    recordCard(card, playerId, trickNumber, position = 0) {
        // 🛡️ SAFETY: Input Validation
        if (!card || typeof card !== 'object') {
            console.error(`❌ CardMemory: Invalid card object:`, card);
            return;
        }
        
        if (!card.suit || !card.value) {
            console.error(`❌ CardMemory: Card missing suit/value:`, card);
            return;
        }
        
        if (typeof playerId !== 'number' || playerId < 0 || playerId > 3) {
            console.error(`❌ CardMemory: Invalid playerId:`, playerId);
            return;
        }
        
        try {
            const cardKey = this.getCardKey(card);
            
            // Basis-Registrierung
            this.playedCards.add(cardKey);
            
            if (!this.cardsByPlayer.has(playerId)) {
                this.cardsByPlayer.set(playerId, []);
            }
            
            const cardRecord = {
                card: { ...card }, // 🛡️ SAFETY: Create safe copy
                trick: trickNumber,
                position: position,
                timestamp: Date.now()
            };
            
            this.cardsByPlayer.get(playerId).push(cardRecord);
            
            // Erweiterte Analysen mit Null-Safety
            this.updateSuitAnalysis(card, playerId);
            this.updateTrumpAnalysis(card, playerId);
            this.updatePartnershipAnalysis(card, playerId, trickNumber);
            
            // Debug für wichtige Karten
            if (this.isImportantCard(card)) {
                console.log(`🎯 Wichtige Karte registriert: ${card.suit} ${card.value} von Spieler ${playerId}`);
            }
        } catch (error) {
            console.error(`❌ CardMemory recordCard Fehler:`, error);
        }
    }
    
    /**
     * 🛡️ FIXED: Schätzt verbleibende Trümpfe mit Null-Safety
     */
    estimateRemainingTrumps(gameContext) {
        try {
            // 🛡️ SAFETY: Validate gameContext
            if (!gameContext || typeof gameContext !== 'object') {
                console.warn(`⚠️ CardMemory: Invalid gameContext, returning default estimate`);
                return 7; // Default estimate
            }
            
            const totalTrumps = this.getTotalTrumpCount(gameContext.gameType);
            let playedTrumps = 0;
            
            // Zähle alle gespielten Trümpfe mit Null-Checks
            for (const cardKey of this.playedCards) {
                try {
                    const card = this.parseCardKey(cardKey);
                    if (card && this.isTrump(card, gameContext)) {
                        playedTrumps++;
                    }
                } catch (error) {
                    console.warn(`⚠️ CardMemory: Error parsing card key ${cardKey}:`, error);
                    continue;
                }
            }
            
            return Math.max(0, totalTrumps - playedTrumps);
        } catch (error) {
            console.error(`❌ CardMemory estimateRemainingTrumps Fehler:`, error);
            return 7; // Safe fallback
        }
    }
    
    /**
     * HILFSFUNKTIONEN mit Null-Safety
     */
    
    getCardKey(card) {
        // 🛡️ SAFETY: Validate card before creating key
        if (!card || !card.suit || !card.value) {
            console.error(`❌ getCardKey: Invalid card:`, card);
            return 'invalid_card';
        }
        return `${card.suit}_${card.value}`;
    }
    
    parseCardKey(key) {
        // 🛡️ SAFETY: Validate key format
        if (!key || typeof key !== 'string') {
            return null;
        }
        
        const parts = key.split('_');
        if (parts.length !== 2) {
            return null;
        }
        
        const [suit, value] = parts;
        return suit && value ? { suit, value } : null;
    }
    
    hasCardBeenPlayed(card) {
        // 🛡️ SAFETY: Validate card
        if (!card || !card.suit || !card.value) {
            return false;
        }
        
        try {
            return this.playedCards.has(this.getCardKey(card));
        } catch (error) {
            console.error(`❌ hasCardBeenPlayed Fehler:`, error);
            return false;
        }
    }
    
    /**
     * 🛡️ FIXED: getCardPlayedBy with comprehensive null checks
     */
    getCardPlayedBy(card) {
        // 🛡️ SAFETY: Validate input card
        if (!card || !card.suit || !card.value) {
            console.error(`❌ getCardPlayedBy: Invalid card:`, card);
            return -1;
        }
        
        try {
            for (const [playerId, cards] of this.cardsByPlayer.entries()) {
                if (!Array.isArray(cards)) {
                    console.warn(`⚠️ getCardPlayedBy: Invalid cards array for player ${playerId}`);
                    continue;
                }
                
                const found = cards.find(record => {
                    // 🛡️ SAFETY: Validate record and record.card
                    if (!record || !record.card) {
                        console.warn(`⚠️ getCardPlayedBy: Invalid record:`, record);
                        return false;
                    }
                    
                    const recordCard = record.card;
                    if (!recordCard.suit || !recordCard.value) {
                        console.warn(`⚠️ getCardPlayedBy: Record card missing suit/value:`, recordCard);
                        return false;
                    }
                    
                    // 🛡️ SAFE COMPARISON: Both cards are validated
                    return recordCard.suit === card.suit && recordCard.value === card.value;
                });
                
                if (found) return playerId;
            }
        } catch (error) {
            console.error(`❌ getCardPlayedBy Fehler:`, error);
        }
        
        return -1;
    }
    
    getTotalTrumpCount(gameType) {
        switch (gameType) {
            case 'wenz': return 4; // Nur Unter
            case 'farbsolo': return 14; // Ober + Unter + 6 der Trumpffarbe
            case 'rufspiel': return 14; // Ober + Unter + Herz
            default: return 14;
        }
    }
    
    /**
     * 🛡️ FIXED: isTrump with null safety
     */
    isTrump(card, gameContext) {
        // 🛡️ SAFETY: Validate inputs
        if (!card || !card.value) {
            return false;
        }
        
        if (!gameContext) {
            return false;
        }
        
        try {
            if (card.value === 'ober' || card.value === 'unter') {
                return true;
            }
            
            if (gameContext.gameType === 'wenz') {
                return false; // Nur Unter sind Trump
            }
            
            return card.suit === gameContext.trumpSuit;
        } catch (error) {
            console.error(`❌ isTrump Fehler:`, error);
            return false;
        }
    }
    
    /**
     * 🛡️ FIXED: isImportantCard with null safety
     */
    isImportantCard(card) {
        // 🛡️ SAFETY: Validate card
        if (!card || !card.value) {
            return false;
        }
        
        try {
            return ['ass', 'ober', 'unter', '10'].includes(card.value.toLowerCase());
        } catch (error) {
            console.error(`❌ isImportantCard Fehler:`, error);
            return false;
        }
    }
    
    /**
     * 🛡️ FIXED: updateSuitAnalysis with null safety
     */
    updateSuitAnalysis(card, playerId) {
        // 🛡️ SAFETY: Validate inputs
        if (!card || !card.suit) {
            console.warn(`⚠️ updateSuitAnalysis: Invalid card:`, card);
            return;
        }
        
        if (typeof playerId !== 'number') {
            console.warn(`⚠️ updateSuitAnalysis: Invalid playerId:`, playerId);
            return;
        }
        
        try {
            if (!this.suitCounts.has(card.suit)) {
                this.suitCounts.set(card.suit, new Map());
            }
            
            const suitMap = this.suitCounts.get(card.suit);
            suitMap.set(playerId, (suitMap.get(playerId) || 0) + 1);
        } catch (error) {
            console.error(`❌ updateSuitAnalysis Fehler:`, error);
        }
    }
    
    /**
     * 🛡️ FIXED: updateTrumpAnalysis with null safety
     */
    updateTrumpAnalysis(card, playerId) {
        // 🛡️ SAFETY: Validate inputs
        if (!card || !card.value) {
            console.warn(`⚠️ updateTrumpAnalysis: Invalid card:`, card);
            return;
        }
        
        if (typeof playerId !== 'number') {
            console.warn(`⚠️ updateTrumpAnalysis: Invalid playerId:`, playerId);
            return;
        }
        
        try {
            if (card.value === 'ober' || card.value === 'unter') {
                this.trumpCounts.set(playerId, (this.trumpCounts.get(playerId) || 0) + 1);
            }
        } catch (error) {
            console.error(`❌ updateTrumpAnalysis Fehler:`, error);
        }
    }
    
    /**
     * 🛡️ FIXED: updatePartnershipAnalysis with comprehensive null safety
     */
    updatePartnershipAnalysis(card, playerId, trickNumber) {
        if (this.gameMode !== 'rufspiel') return;
        
        // 🛡️ SAFETY: Validate inputs
        if (!card || !card.suit || !card.value) {
            console.warn(`⚠️ updatePartnershipAnalysis: Invalid card:`, card);
            return;
        }
        
        if (typeof playerId !== 'number') {
            console.warn(`⚠️ updatePartnershipAnalysis: Invalid playerId:`, playerId);
            return;
        }
        
        try {
            if (!this.partnershipClues.has(playerId)) {
                this.partnershipClues.set(playerId, {
                    calledSuitCards: 0,
                    cooperativeActions: 0,
                    trumpUsage: []
                });
            }
            
            const clues = this.partnershipClues.get(playerId);
            
            // 🛡️ SAFETY: Validate calledAce before using
            if (this.calledAce && this.calledAce.suit && card.suit === this.calledAce.suit) {
                clues.calledSuitCards++;
            }
            
            if (card.value === 'ober' || card.value === 'unter') {
                clues.trumpUsage.push({
                    trick: trickNumber,
                    card: { ...card }, // 🛡️ SAFETY: Safe copy
                    strength: this.getTrumpStrength(card)
                });
            }
        } catch (error) {
            console.error(`❌ updatePartnershipAnalysis Fehler:`, error);
        }
    }
    
    /**
     * 🛡️ FIXED: getTrumpStrength with null safety
     */
    getTrumpStrength(card) {
        // 🛡️ SAFETY: Validate card
        if (!card || !card.value) {
            return 0.1; // Minimum strength
        }
        
        try {
            if (card.value === 'unter') return 0.2;
            if (card.value === 'ober') return 0.6;
            
            const herzOrder = ['7', '8', '9', '10', 'könig', 'ass'];
            const index = herzOrder.indexOf(card.value);
            return index >= 0 ? 0.7 + (index * 0.05) : 0.5;
        } catch (error) {
            console.error(`❌ getTrumpStrength Fehler:`, error);
            return 0.1;
        }
    }
    
    save() {
        try {
            return {
                playedCards: Array.from(this.playedCards),
                cardsByPlayer: Array.from(this.cardsByPlayer.entries()),
                trickHistory: this.trickHistory,
                suitCounts: Array.from(this.suitCounts.entries()),
                trumpCounts: Array.from(this.trumpCounts.entries()),
                partnershipClues: Array.from(this.partnershipClues.entries()),
                gameMode: this.gameMode,
                calledAce: this.calledAce,
                partnerRevealed: this.partnerRevealed
            };
        } catch (error) {
            console.error(`❌ CardMemory save Fehler:`, error);
            return {}; // Safe fallback
        }
    }
    
    load(data) {
        try {
            // 🛡️ SAFETY: Validate data before loading
            if (!data || typeof data !== 'object') {
                console.warn(`⚠️ CardMemory load: Invalid data`);
                return;
            }
            
            this.playedCards = new Set(data.playedCards || []);
            this.cardsByPlayer = new Map(data.cardsByPlayer || []);
            this.trickHistory = data.trickHistory || [];
            this.suitCounts = new Map(data.suitCounts || []);
            this.trumpCounts = new Map(data.trumpCounts || []);
            this.partnershipClues = new Map(data.partnershipClues || []);
            this.gameMode = data.gameMode || 'rufspiel';
            this.calledAce = data.calledAce;
            this.partnerRevealed = data.partnerRevealed || false;
            
            console.log('📂 CardMemory erfolgreich geladen');
        } catch (error) {
            console.error(`❌ CardMemory load Fehler:`, error);
            this.reset(); // Reset on load failure
        }
    }
    
    reset() {
        try {
            this.playedCards.clear();
            this.cardsByPlayer.clear();
            this.trickHistory = [];
            this.suitCounts.clear();
            this.trumpCounts.clear();
            this.partnershipClues.clear();
            this.currentTrick = null;
            this.partnerRevealed = false;
            
            console.log('🔄 Card Memory zurückgesetzt');
        } catch (error) {
            console.error(`❌ CardMemory reset Fehler:`, error);
        }
    }
}

// Browser-globale Verfügbarkeit
if (typeof window !== 'undefined') {
    window.SchafkopfCardMemory = SchafkopfCardMemory;
    window.CardMemory = SchafkopfCardMemory; // Alias für Kompatibilität
    
    console.log('🔧 SchafkopfCardMemory an window exportiert (mit AI-Bug-Fix)');
}
