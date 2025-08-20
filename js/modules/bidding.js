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
 * NEUE REGELN: Mindestens 5 Trumpfkarten, davon mindestens 2 Ober/Unter
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
        
        // NEUE REGEL: Alle Trumpfkarten zählen (Ober, Unter, Herz)
        const oberUnter = cards.filter(card => card.value === 'ober' || card.value === 'unter');
        const herzCards = cards.filter(card => card.suit === 'herz' && card.value !== 'ober' && card.value !== 'unter');
        const totalTrumpCards = oberUnter.length + herzCards.length;
        
        console.log(`🤖 ${player.name}: ${oberUnter.length} Ober/Unter, ${herzCards.length} Herz, ${totalTrumpCards} Trümpfe gesamt`);
        
        // NEUE REGEL 1: Mindestens 5 Trumpfkarten insgesamt
        if (totalTrumpCards < 5) {
            console.log(`🤖 ${player.name}: Pass (nur ${totalTrumpCards} Trümpfe, brauche 5)`);
            return { type: 'pass' };
        }
        
        // NEUE REGEL 2: Davon mindestens 2 Ober oder Unter
        if (oberUnter.length < 2) {
            console.log(`🤖 ${player.name}: Pass (nur ${oberUnter.length} Ober/Unter, brauche 2)`);
            return { type: 'pass' };
        }
        
        // Regel 3: Eine Karte einer Farbe ohne das Ass zu haben
        const calledAce = CPUBiddingLogic._findCallableAce(cards);
        if (!calledAce) {
            console.log(`🤖 ${player.name}: Pass (kein rufbares Ass)`);
            return { type: 'pass' };
        }
        
        console.log(`🤖 ${player.name} spielt Rufspiel (${calledAce}-Ass) - ${totalTrumpCards} Trümpfe, ${oberUnter.length} Ober/Unter`);
        return {
            type: 'rufspiel',
            details: { ace: calledAce }
        };
    }
    
    /**
     * Findet ein rufbares Ass (Farbe ohne eigenes Ass)
     * 🔧 FIXED: 'ass' → 'sau' für korrekte Schafkopf-Kartenwerte
     */
    static _findCallableAce(cards) {
        const suits = ['eichel', 'gras', 'schellen'];
        // ✅ FIX: Verwende 'sau' statt 'ass' (Schafkopf-Standard)
        const ownAces = cards.filter(card => card.value === 'sau').map(card => card.suit);
        
        // Prüfe jede Farbe
        for (const suit of suits) {
            // Hat er das Ass dieser Farbe?
            const hasAce = ownAces.includes(suit);
            
            // Hat er mindestens eine Karte dieser Farbe (aber nicht das Ass)?
            const hasCardInSuit = cards.some(card => 
                card.suit === suit && 
                card.value !== 'sau' &&  // ✅ FIX: Verwende 'sau' statt 'ass'
                card.value !== 'ober' && 
                card.value !== 'unter'
            );
            
            if (!hasAce && hasCardInSuit) {
                return suit; // Kann dieses Ass rufen
            }
        }
        
        return null; // Kein rufbares Ass gefunden
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

// BROWSER WINDOW BINDING - FIX für "BiddingManager available: false"
if (typeof window !== 'undefined') {
    window.BiddingManager = BiddingManager;
    window.CPUBiddingLogic = CPUBiddingLogic;
    window.createBiddingManager = createBiddingManager;
    window.getGlobalBiddingManager = getGlobalBiddingManager;
    
    console.log('🔧 BiddingManager an window exportiert');
}
