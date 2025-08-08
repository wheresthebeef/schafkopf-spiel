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
    
    endRoundTracking: function() {
        if (!this.enabled) return;
        
        console.log('🏁 Runde beendet - Gesammelte Bot-Züge:');
        console.table(this.currentRoundMoves);
        
        // TODO: Hier kommt später das Post-Game Review Modal
        this.isTrackingRound = false;
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
