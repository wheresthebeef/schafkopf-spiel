/**
 * Bayerisches Schafkopf - Card Memory System
 * Intelligentes Kartengedächtnis für AI-Strategien
 * Verfolgt gespielte Karten und schätzt Wahrscheinlichkeiten
 */

/**
 * Erweiterte Kartengedächtnis-Klasse
 * Optimiert für Schafkopf-spezifische Strategien
 */
export class SchafkopfCardMemory {
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
     * Hauptfunktion: Registriert gespielte Karte
     */
    recordCard(card, playerId, trickNumber, position = 0) {
        const cardKey = this.getCardKey(card);
        
        // Basis-Registrierung
        this.playedCards.add(cardKey);
        
        if (!this.cardsByPlayer.has(playerId)) {
            this.cardsByPlayer.set(playerId, []);
        }
        
        const cardRecord = {
            card: card,
            trick: trickNumber,
            position: position,
            timestamp: Date.now()
        };
        
        this.cardsByPlayer.get(playerId).push(cardRecord);
        
        // Erweiterte Analysen
        this.updateSuitAnalysis(card, playerId);
        this.updateTrumpAnalysis(card, playerId);
        this.updatePartnershipAnalysis(card, playerId, trickNumber);
        
        // Debug für wichtige Karten
        if (this.isImportantCard(card)) {
            console.log(`🎯 Wichtige Karte registriert: ${card.suit} ${card.value} von Spieler ${playerId}`);
        }
    }
    
    /**
     * Schätzt verbleibende Trümpfe im Spiel
     */
    estimateRemainingTrumps(gameContext) {
        const totalTrumps = this.getTotalTrumpCount(gameContext.gameType);
        let playedTrumps = 0;
        
        // Zähle alle gespielten Trümpfe
        for (const cardKey of this.playedCards) {
            const card = this.parseCardKey(cardKey);
            if (this.isTrump(card, gameContext)) {
                playedTrumps++;
            }
        }
        
        return Math.max(0, totalTrumps - playedTrumps);
    }
    
    /**
     * HILFSFUNKTIONEN
     */
    
    getCardKey(card) {
        return `${card.suit}_${card.value}`;
    }
    
    parseCardKey(key) {
        const [suit, value] = key.split('_');
        return { suit, value };
    }
    
    hasCardBeenPlayed(card) {
        return this.playedCards.has(this.getCardKey(card));
    }
    
    getCardPlayedBy(card) {
        for (const [playerId, cards] of this.cardsByPlayer.entries()) {
            const found = cards.find(record => 
                record.card.suit === card.suit && record.card.value === card.value
            );
            if (found) return playerId;
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
    
    isTrump(card, gameContext) {
        if (card.value === 'ober' || card.value === 'unter') {
            return true;
        }
        
        if (gameContext.gameType === 'wenz') {
            return false; // Nur Unter sind Trump
        }
        
        return card.suit === gameContext.trumpSuit;
    }
    
    isImportantCard(card) {
        return ['ass', 'ober', 'unter', '10'].includes(card.value.toLowerCase());
    }
    
    updateSuitAnalysis(card, playerId) {
        if (!this.suitCounts.has(card.suit)) {
            this.suitCounts.set(card.suit, new Map());
        }
        
        const suitMap = this.suitCounts.get(card.suit);
        suitMap.set(playerId, (suitMap.get(playerId) || 0) + 1);
    }
    
    updateTrumpAnalysis(card, playerId) {
        if (card.value === 'ober' || card.value === 'unter') {
            this.trumpCounts.set(playerId, (this.trumpCounts.get(playerId) || 0) + 1);
        }
    }
    
    updatePartnershipAnalysis(card, playerId, trickNumber) {
        if (this.gameMode !== 'rufspiel') return;
        
        if (!this.partnershipClues.has(playerId)) {
            this.partnershipClues.set(playerId, {
                calledSuitCards: 0,
                cooperativeActions: 0,
                trumpUsage: []
            });
        }
        
        const clues = this.partnershipClues.get(playerId);
        
        if (this.calledAce && card.suit === this.calledAce.suit) {
            clues.calledSuitCards++;
        }
        
        if (card.value === 'ober' || card.value === 'unter') {
            clues.trumpUsage.push({
                trick: trickNumber,
                card: card,
                strength: this.getTrumpStrength(card)
            });
        }
    }
    
    getTrumpStrength(card) {
        if (card.value === 'unter') return 0.2;
        if (card.value === 'ober') return 0.6;
        
        const herzOrder = ['7', '8', '9', '10', 'könig', 'ass'];
        const index = herzOrder.indexOf(card.value);
        return index >= 0 ? 0.7 + (index * 0.05) : 0.5;
    }
    
    save() {
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
    }
    
    load(data) {
        this.playedCards = new Set(data.playedCards || []);
        this.cardsByPlayer = new Map(data.cardsByPlayer || []);
        this.trickHistory = data.trickHistory || [];
        this.suitCounts = new Map(data.suitCounts || []);
        this.trumpCounts = new Map(data.trumpCounts || []);
        this.partnershipClues = new Map(data.partnershipClues || []);
        this.gameMode = data.gameMode || 'rufspiel';
        this.calledAce = data.calledAce;
        this.partnerRevealed = data.partnerRevealed || false;
    }
    
    reset() {
        this.playedCards.clear();
        this.cardsByPlayer.clear();
        this.trickHistory = [];
        this.suitCounts.clear();
        this.trumpCounts.clear();
        this.partnershipClues.clear();
        this.currentTrick = null;
        this.partnerRevealed = false;
        
        console.log('🔄 Card Memory zurückgesetzt');
    }
}

// Export für Verwendung in anderen Modulen
export { SchafkopfCardMemory as CardMemory };