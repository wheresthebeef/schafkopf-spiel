console.log('🚀 Post-Game Training - Clean Version');

window.postGameTraining = {
    enabled: false,
    
    enable: function() {
        console.log('✅ System aktiviert!');
        this.enabled = true;
        return true;
    },
    
    demoGame: function() {
        console.log('🎯 Demo läuft...');
        alert('Demo-Funktion funktioniert!');
    },
    
    disable: function() {
        this.enabled = false;
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
