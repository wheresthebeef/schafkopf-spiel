console.log('🚀 Post-Game Training - Clean Version');

window.postGameTraining = {
    enabled: false,
    currentRoundMoves: [],
    isTrackingRound: false,
    
    enable: function() {
        console.log('✅ System aktiviert!');
        this.enabled = true;
        this.startTracking();
        return true;
    },
    
    startTracking: function() {
        this.isTrackingRound = true;
        this.currentRoundMoves = [];
        console.log('🎯 Bot-Züge werden jetzt getrackt...');
    },
    
    trackBotMove: function(playerName, card, moveContext) {
        if (!this.enabled || !this.isTrackingRound) return;
        
        const move = {
            player: playerName,
            card: card,
            timestamp: new Date().toLocaleTimeString(),
            context: moveContext || {}
        };
        
        this.currentRoundMoves.push(move);
        console.log(`📝 Tracked: ${playerName} spielt ${card}`);
    },
    
    endTrickTracking: function() {
        console.log('🔍 DEBUG: endTrickTracking() aufgerufen');
        console.log('🔍 DEBUG: enabled =', this.enabled, ', isTrackingRound =', this.isTrackingRound);
        console.log('🔍 DEBUG: currentRoundMoves.length =', this.currentRoundMoves.length);
        
        if (!this.enabled || !this.isTrackingRound) {
            console.log('🔍 DEBUG: Tracking nicht aktiv - beende');
            return;
        }
        
        // Nur Bot-Züge aus dem aktuellen Stich anzeigen
        const currentTrickMoves = this.currentRoundMoves.slice(-3); // Maximal 3 Bots pro Stich
        
        console.log('🔍 DEBUG: currentTrickMoves =', currentTrickMoves);
        
        if (currentTrickMoves.length > 0) {
            console.log('🏼 Stich beendet - Bot-Züge dieses Stichs:');
            console.table(currentTrickMoves);
            
            // TODO: Hier kommt später das Post-Game Review Modal
            this.showTrickReview(currentTrickMoves);
        } else {
            console.log('🔍 DEBUG: Keine Bot-Züge für diesen Stich gefunden');
        }
    },
    
    showTrickReview: function(trickMoves) {
        // Vorerst nur Console-Ausgabe - UI kommt als nächstes
        console.log('🎯 Trick Review würde hier angezeigt werden für:', trickMoves);
    },
    
    endRoundTracking: function() {
        if (!this.enabled) return;
        
        console.log('🏁 Komplette Runde beendet - Alle Bot-Züge:');
        console.table(this.currentRoundMoves);
        
        // Tracking zurücksetzen für nächste Runde
        this.isTrackingRound = false;
        this.currentRoundMoves = [];
    },
    
    demoGame: function() {
        console.log('🎯 Demo läuft...');
        alert('Demo-Funktion funktioniert!');
    },
    
    disable: function() {
        this.enabled = false;
        this.isTrackingRound = false;
        this.currentRoundMoves = [];
        console.log('❌ System deaktiviert');
    }
};

window.enableHumanTraining = function() {
    return window.postGameTraining.enable();
};

window.disableHumanTraining = function() {
    return window.postGameTraining.disable();
};

console.log('✅ postGameTraining ist verfügbar!');
console.log('Test: enableHumanTraining()');
