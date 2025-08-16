/**
 * Game Controller - Verbindet Bidding-System mit game-state
 * Koordiniert zwischen Modulen ohne game-state.js zu verändern
 */

/**
 * Game Controller Klasse
 * Verwaltet die Integration von Bidding in das bestehende Spiel
 */
class GameController {
    constructor() {
        this.biddingManager = null;
        this.integrationCallbacks = {};
    }
    
    /**
     * Initialisiert den Game Controller
     * @param {Object} callbacks - Callback-Funktionen für Integration
     */
    initialize(callbacks = {}) {
        this.integrationCallbacks = {
            onBiddingComplete: callbacks.onBiddingComplete || (() => {}),
            onPlayerTurn: callbacks.onPlayerTurn || (() => {}),
            onGameStateUpdate: callbacks.onGameStateUpdate || (() => {}),
            ...callbacks
        };
        
        console.log('🎮 Game Controller initialisiert');
    }
    
    /**
     * Startet das Bidding-System
     * @param {Array} players - Spieler aus game-state
     * @param {number} vorhandIndex - Vorhand-Index aus game-state
     */
    startBidding(players, vorhandIndex) {
        // Neuen BiddingManager erstellen
        this.biddingManager = new BiddingManager();
        
        // Bidding starten
        const result = this.biddingManager.startBidding(players, vorhandIndex);
        
        if (result.success) {
            console.log(`🎮 Bidding-Phase gestartet mit ${players[vorhandIndex].name}`);
            
            // Callback für UI-Update
            this.integrationCallbacks.onGameStateUpdate({
                phase: 'bidding',
                currentBidder: result.currentBidder,
                biddingActive: true
            });
            
            // CPU-Bidding automatisch starten wenn CPU am Zug
            if (!players[result.currentBidder].isHuman) {
                setTimeout(() => this.processCPUBid(), 1000);
            }
        }
        
        return result;
    }
    
    /**
     * Verarbeitet ein menschliches Spieler-Gebot
     * @param {string} bidType - 'rufspiel', 'solo', 'wenz', 'pass'
     * @param {Object} bidDetails - Zusätzliche Details
     */
    processHumanBid(bidType, bidDetails = {}) {
        if (!this.biddingManager || this.biddingManager.phase !== 'active') {
            console.warn('🎮 Kein aktives Bidding');
            return { success: false, error: 'Kein aktives Bidding' };
        }
        
        const currentBidder = this.biddingManager.currentBidder;
        const player = this.biddingManager.players[currentBidder];
        
        // Prüfen ob menschlicher Spieler am Zug
        if (!player.isHuman) {
            return { success: false, error: 'CPU-Spieler am Zug' };
        }
        
        console.log(`🎮 Menschliches Gebot: ${player.name} → ${bidType}`);
        
        // Gebot verarbeiten
        const result = this.biddingManager.processBid(currentBidder, bidType, bidDetails);
        
        // Nach dem Gebot weiterverarbeiten
        this._handleBidResult(result);
        
        return result;
    }
    
    /**
     * Verarbeitet automatisch CPU-Gebote
     */
    processCPUBid() {
        if (!this.biddingManager || this.biddingManager.phase !== 'active') {
            return;
        }
        
        const currentBidder = this.biddingManager.currentBidder;
        const player = this.biddingManager.players[currentBidder];
        
        // Nur CPU-Spieler
        if (player.isHuman) {
            return;
        }
        
        // CPU-Gebot ermitteln
        const cpuBid = CPUBiddingLogic.getCPUBid(player, player.cards);
        
        console.log(`🎮 CPU-Gebot: ${player.name} → ${cpuBid.type}`);
        
        // Gebot verarbeiten
        const result = this.biddingManager.processBid(currentBidder, cpuBid.type, cpuBid.details);
        
        // Nach dem Gebot weiterverarbeiten
        this._handleBidResult(result);
    }
    
    /**
     * Verarbeitet das Ergebnis eines Gebots
     * @param {Object} result - Ergebnis von processBid()
     */
    _handleBidResult(result) {
        if (!result.success) {
            console.error('🎮 Bidding-Fehler:', result.error);
            return;
        }
        
        // UI über aktuellen Status informieren
        this.integrationCallbacks.onGameStateUpdate({
            phase: 'bidding',
            currentBidder: result.currentBidder,
            biddingActive: !result.finished,
            biddingResult: result.result
        });
        
        if (result.finished) {
            // Bidding beendet
            console.log('🎮 Bidding beendet:', result.result.message);
            
            // Callback für Bidding-Abschluss
            this.integrationCallbacks.onBiddingComplete(result.result);
            
            // Weiter zum nächsten Schritt
            this._handleBiddingComplete(result.result);
        } else {
            // Nächster Spieler am Zug
            const nextPlayer = this.biddingManager.players[result.currentBidder];
            
            this.integrationCallbacks.onPlayerTurn(result.currentBidder, nextPlayer);
            
            // Wenn CPU am Zug, automatisch weiter
            if (!nextPlayer.isHuman) {
                setTimeout(() => this.processCPUBid(), 1500);
            }
        }
    }
    
    /**
     * Behandelt den Abschluss des Biddings
     * @param {Object} biddingResult - Ergebnis des Biddings
     */
    _handleBiddingComplete(biddingResult) {
        if (biddingResult.newDeal) {
            // Alle weg - neu geben
            console.log('🎮 Neu geben erforderlich');
            
            this.integrationCallbacks.onGameStateUpdate({
                phase: 'newDeal',
                message: 'Alle weg - Karten werden neu gegeben'
            });
            
            // Hier könnte automatisch neu gegeben werden
            
        } else {
            // Spiel beginnt
            console.log(`🎮 Spiel beginnt: ${biddingResult.message}`);
            
            // Game-State für Spielbeginn vorbereiten
            const gameConfig = {
                caller: biddingResult.caller,
                gameType: biddingResult.gameType,
                calledAce: biddingResult.calledAce,
                trumpSuit: biddingResult.trumpSuit || 'herz',
                phase: 'playing'
            };
            
            this.integrationCallbacks.onGameStateUpdate(gameConfig);
            
            // Partnerschaften ermitteln (bei Rufspiel)
            if (biddingResult.gameType === 'rufspiel') {
                this._setupRufspielPartnerships(biddingResult);
            }
        }
    }
    
    /**
     * Richtet Partnerschaften für Rufspiel ein
     * @param {Object} biddingResult - Bidding-Ergebnis
     */
    _setupRufspielPartnerships(biddingResult) {
        console.log(`🎮 Rufspiel-Partnerschaften: Rufer ${biddingResult.caller}, gerufenes Ass: ${biddingResult.calledAce}`);
        
        // Callback für Partnership-Setup
        this.integrationCallbacks.onGameStateUpdate({
            partnerships: {
                caller: biddingResult.caller,
                calledAce: biddingResult.calledAce,
                partnerRevealed: false
            }
        });
    }
    
    /**
     * Gibt aktuellen Bidding-Status zurück
     */
    getBiddingStatus() {
        if (!this.biddingManager) {
            return { active: false, phase: 'none' };
        }
        
        return {
            active: this.biddingManager.phase === 'active',
            ...this.biddingManager.getStatus()
        };
    }
    
    /**
     * Debug-Ausgabe des Controllers
     */
    debug() {
        console.log('🎮 Game Controller Debug:');
        if (this.biddingManager) {
            this.biddingManager.debug();
        } else {
            console.log('Kein aktiver BiddingManager');
        }
    }
    
    /**
     * Setzt den Controller zurück
     */
    reset() {
        this.biddingManager = null;
        console.log('🎮 Game Controller zurückgesetzt');
    }
}

/**
 * Integration Helper - Einfache Funktionen für die Integration
 */
class BiddingIntegration {
    /**
     * Startet Bidding mit game-state Integration
     * @param {Object} gameStateRef - Referenz auf gameState
     * @param {Function} updateUI - UI-Update Funktion
     */
    static startBiddingPhase(gameStateRef, updateUI) {
        // Game Controller initialisieren
        if (!window.gameController) {
            window.gameController = new GameController();
            
            window.gameController.initialize({
                onBiddingComplete: (result) => {
                    // Game-State aktualisieren
                    if (!result.newDeal) {
                        gameStateRef.gameType = result.gameType;
                        gameStateRef.calledAce = result.calledAce;
                        gameStateRef.calledAcePlayer = result.caller;
                        gameStateRef.gamePhase = 'playing';
                        
                        if (result.trumpSuit) {
                            gameStateRef.trumpSuit = result.trumpSuit;
                        }
                    }
                    
                    // UI aktualisieren
                    if (updateUI) updateUI();
                },
                
                onGameStateUpdate: (updates) => {
                    console.log('🎮 Game-State Update:', updates);
                    if (updateUI) updateUI();
                },
                
                onPlayerTurn: (playerIndex, player) => {
                    console.log(`🎮 ${player.name} ist am Zug`);
                    if (updateUI) updateUI();
                }
            });
        }
        
        // Bidding mit aktuellen Spielern starten
        return window.gameController.startBidding(gameStateRef.players, gameStateRef.vorhand);
    }
    
    /**
     * Verarbeitet menschliches Gebot
     */
    static processBid(bidType, bidDetails) {
        if (window.gameController) {
            return window.gameController.processHumanBid(bidType, bidDetails);
        }
        return { success: false, error: 'Game Controller nicht initialisiert' };
    }
    
    /**
     * Gibt Bidding-Status zurück
     */
    static getBiddingStatus() {
        if (window.gameController) {
            return window.gameController.getBiddingStatus();
        }
        return { active: false };
    }
}

// Globale Instanz für einfache Nutzung
if (typeof window !== 'undefined') {
    window.GameController = GameController;
    window.BiddingIntegration = BiddingIntegration;
}

// Export für Module-System
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameController, BiddingIntegration };
}