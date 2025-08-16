/**
 * Schafkopf Bidding System - Modulare Implementation
 * Verwaltet das Bieten bei Schafkopf unabhängig vom game-state
 */

/**
 * Bidding-Manager Klasse
 * Verwaltet den kompletten Bidding-Prozess
 */
class BiddingManager {
    constructor() {
        this.reset();
    }
    
    /**
     * Setzt den Bidding-Zustand zurück
     */
    reset() {
        this.players = [];
        this.vorhand = 0;
        this.currentBidder = 0;
        this.biddingOrder = [];
        this.playerBids = [];
        this.activeBidder = -1;
        this.finished = false;
        this.result = null;
        this.phase = 'waiting'; // 'waiting', 'active', 'finished'
    }
    
    /**
     * Startet das Bidding
     * @param {Array} players - Array mit Spieler-Objekten 
     * @param {number} vorhandIndex - Index der Vorhand
     */
    startBidding(players, vorhandIndex) {
        this.reset();
        this.players = [...players];
        this.vorhand = vorhandIndex;
        this.currentBidder = vorhandIndex;
        
        // Bidding-Reihenfolge: Vorhand → Uhrzeigersinn
        this.biddingOrder = [];
        for (let i = 0; i < players.length; i++) {
            this.biddingOrder.push((vorhandIndex + i) % players.length);
        }
        
        this.playerBids = new Array(players.length).fill(null);
        this.phase = 'active';
        
        console.log(`🎯 Bidding gestartet: ${players[vorhandIndex].name} beginnt`);
        console.log(`Reihenfolge: ${this.biddingOrder.map(i => players[i].name).join(' → ')}`);
        
        return {
            success: true,
            currentBidder: this.currentBidder,
            phase: this.phase
        };
    }
    
    /**
     * Verarbeitet ein Gebot eines Spielers
     * @param {number} playerIndex - Index des Spielers
     * @param {string} bidType - 'rufspiel', 'solo', 'wenz', 'pass'
     * @param {Object} bidDetails - Zusätzliche Details (z.B. Solo-Farbe)
     */
    processBid(playerIndex, bidType, bidDetails = {}) {
        if (this.phase !== 'active') {
            return { success: false, error: 'Bidding nicht aktiv' };
        }
        
        if (playerIndex !== this.currentBidder) {
            return { success: false, error: 'Spieler nicht am Zug' };
        }
        
        // Gebot speichern
        this.playerBids[playerIndex] = {
            type: bidType,
            details: bidDetails,
            timestamp: Date.now()
        };
        
        console.log(`${this.players[playerIndex].name}: ${bidType}`);
        
        // Rufspiel → wird aktiver Bieter
        if (bidType === 'rufspiel') {
            this.activeBidder = playerIndex;
        }
        
        // Solo/Wenz → höchstes Gebot, Bidding sofort beendet
        if (bidType === 'solo' || bidType === 'wenz') {
            this.activeBidder = playerIndex;
            this.finished = true;
            this.phase = 'finished';
            this.result = this._createResult();
            
            console.log(`🎯 ${bidType.toUpperCase()} von ${this.players[playerIndex].name} - Bidding beendet!`);
            return { success: true, finished: true, result: this.result };
        }
        
        // Nächster Bieter
        this._nextBidder();
        
        // Prüfen ob Bidding beendet
        if (this._isBiddingFinished()) {
            this.finished = true;
            this.phase = 'finished';
            this.result = this._createResult();
            
            console.log(`🎯 Bidding beendet: ${this.result.caller ? this.players[this.result.caller].name + ' spielt ' + this.result.gameType : 'Alle weg - neu geben'}`);
        }
        
        return {
            success: true,
            currentBidder: this.currentBidder,
            finished: this.finished,
            result: this.result
        };
    }
    
    /**
     * Wechselt zum nächsten Bieter
     */
    _nextBidder() {
        const currentOrderIndex = this.biddingOrder.indexOf(this.currentBidder);
        const nextOrderIndex = (currentOrderIndex + 1) % this.biddingOrder.length;
        this.currentBidder = this.biddingOrder[nextOrderIndex];
    }
    
    /**
     * Prüft ob das Bidding beendet ist
     */
    _isBiddingFinished() {
        // Alle haben geboten?
        const allBidded = this.playerBids.every(bid => bid !== null);
        
        if (!allBidded) return false;
        
        // Wenn alle "pass" → neu geben
        // Wenn jemand Rufspiel → Spiel läuft
        return true;
    }
    
    /**
     * Erstellt das Bidding-Ergebnis
     */
    _createResult() {
        if (this.activeBidder === -1) {
            return {
                caller: null,
                gameType: null,
                calledAce: null,
                newDeal: true,
                message: 'Alle weg - neu geben'
            };
        }
        
        const bid = this.playerBids[this.activeBidder];
        
        if (bid.type === 'rufspiel') {
            return {
                caller: this.activeBidder,
                gameType: 'rufspiel',
                calledAce: bid.details.ace || 'eichel', // Default: Eichel-Ass
                newDeal: false,
                message: `${this.players[this.activeBidder].name} spielt Rufspiel`
            };
        }
        
        if (bid.type === 'solo') {
            return {
                caller: this.activeBidder,
                gameType: 'farbsolo',
                trumpSuit: bid.details.suit || 'eichel',
                newDeal: false,
                message: `${this.players[this.activeBidder].name} spielt ${bid.details.suit || 'Eichel'}-Solo`
            };
        }
        
        if (bid.type === 'wenz') {
            return {
                caller: this.activeBidder,
                gameType: 'wenz',
                newDeal: false,
                message: `${this.players[this.activeBidder].name} spielt Wenz`
            };
        }
        
        return { caller: null, gameType: null, newDeal: true };
    }
    
    /**
     * Gibt aktuellen Bidding-Status zurück
     */
    getStatus() {
        return {
            phase: this.phase,
            currentBidder: this.currentBidder,
            currentBidderName: this.players[this.currentBidder]?.name,
            activeBidder: this.activeBidder,
            activeBidderName: this.activeBidder >= 0 ? this.players[this.activeBidder].name : null,
            finished: this.finished,
            result: this.result,
            bids: this.playerBids
        };
    }
    
    /**
     * Debug-Ausgabe des Bidding-Status
     */
    debug() {
        console.log('🎯 Bidding Debug:');
        console.log(`Phase: ${this.phase}`);
        console.log(`Aktueller Bieter: ${this.players[this.currentBidder]?.name} (${this.currentBidder})`);
        console.log(`Aktiver Bieter: ${this.activeBidder >= 0 ? this.players[this.activeBidder].name : 'Keiner'}`);
        console.log('Gebote:');
        this.playerBids.forEach((bid, index) => {
            if (bid) {
                console.log(`  ${this.players[index].name}: ${bid.type}`);
            } else {
                console.log(`  ${this.players[index].name}: (noch kein Gebot)`);
            }
        });
        if (this.result) {
            console.log(`Ergebnis: ${this.result.message}`);
        }
    }
}

/**
 * CPU-Bidding-Logik
 * Einfache Regeln für automatische Gebote
 */
class CPUBiddingLogic {
    /**
     * Ermittelt CPU-Gebot basierend auf Karten
     * @param {Object} player - Spieler-Objekt
     * @param {Array} cards - Karten des Spielers
     * @returns {Object} Gebot-Objekt
     */
    static getCPUBid(player, cards) {
        if (!cards || cards.length === 0) {
            return { type: 'pass' };
        }
        
        // Einfache Rufspiel-Regel: >= 3 Haxn + >= 5 Trumpf
        const trumpCards = cards.filter(card => CPUBiddingLogic._isTrump(card));
        const haxnCards = cards.filter(card => CPUBiddingLogic._isHaxn(card));
        
        console.log(`🤖 ${player.name}: ${trumpCards.length} Trumpf, ${haxnCards.length} Haxn`);
        
        if (trumpCards.length >= 5 && haxnCards.length >= 3) {
            // Welches Ass rufen?
            const calledAce = CPUBiddingLogic._selectCalledAce(cards);
            
            console.log(`🤖 ${player.name} spielt Rufspiel (${calledAce}-Ass)`);
            return {
                type: 'rufspiel',
                details: { ace: calledAce }
            };
        }
        
        console.log(`🤖 ${player.name}: Pass`);
        return { type: 'pass' };
    }
    
    /**
     * Prüft ob Karte Trumpf ist (vereinfacht)
     */
    static _isTrump(card) {
        // Alle Herz + alle Ober + alle Unter
        return card.suit === 'herz' || card.value === 'ober' || card.value === 'unter';
    }
    
    /**
     * Prüft ob Karte Haxn ist (Ass oder 10)
     */
    static _isHaxn(card) {
        return card.value === 'ass' || card.value === '10';
    }
    
    /**
     * Wählt das zu rufende Ass aus
     */
    static _selectCalledAce(cards) {
        const aces = ['eichel', 'gras', 'schellen'];
        const ownAces = cards.filter(card => card.value === 'ass').map(card => card.suit);
        
        // Rufe ein Ass das ich nicht habe
        for (const ace of aces) {
            if (!ownAces.includes(ace)) {
                return ace;
            }
        }
        
        // Fallback: Eichel
        return 'eichel';
    }
}

// Globale Instanz (optional für einfache Nutzung)
let globalBiddingManager = null;

/**
 * Einfache API-Funktionen
 */
function createBiddingManager() {
    return new BiddingManager();
}

function getGlobalBiddingManager() {
    if (!globalBiddingManager) {
        globalBiddingManager = new BiddingManager();
    }
    return globalBiddingManager;
}

// Export für Module-System
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BiddingManager, CPUBiddingLogic };
}