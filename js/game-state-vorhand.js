/**
 * Vorhand-Rotation System für Schafkopf
 * Erweitert game-state.js um korrekte Runden-Rotation
 */

/**
 * Initialisiert das Vorhand-System
 * @param {number} startPlayer - Spieler der die erste Runde beginnt (default: 0 = Mensch)
 */
function initializeVorhand(startPlayer = 0) {
    // Neue Vorhand-Tracking Eigenschaften
    gameState.vorhand = startPlayer; // Wer beginnt die aktuelle Runde
    gameState.initialVorhand = startPlayer; // Ursprünglicher Startspieler
    
    console.log(`🎯 Vorhand initialisiert: ${gameState.players[startPlayer].name} beginnt`);
}

/**
 * Rotiert die Vorhand zum nächsten Spieler (Uhrzeigersinn)
 */
function rotateVorhand() {
    const previousVorhand = gameState.vorhand;
    gameState.vorhand = (gameState.vorhand + 1) % gameState.players.length;
    
    console.log(`🔄 Vorhand rotiert: ${gameState.players[previousVorhand].name} → ${gameState.players[gameState.vorhand].name}`);
    
    logGameAction('Vorhand rotiert', {
        previousVorhand: gameState.players[previousVorhand].name,
        newVorhand: gameState.players[gameState.vorhand].name,
        round: gameState.roundNumber
    });
}

/**
 * Startet eine neue Runde mit korrekter Vorhand-Rotation
 */
function startNewRoundWithVorhand() {
    // Basis-Rundenvorbereitung (wie vorher)
    gameState.currentTrick = [];
    gameState.trickNumber = 0;
    gameState.completedTricks = [];
    gameState.gamePhase = 'playing';
    gameState.calledSuitPlayed = false;

    // Spieler-Rundendaten zurücksetzen
    gameState.players.forEach(player => {
        player.cards = [];
        player.points = 0;
        player.tricks = 0;
        player.tricksWon = [];
    });

    gameState.teamPoints = [0, 0];

    // KORRIGIERT: Vorhand für erste Karte der Runde
    gameState.trickLeadPlayer = gameState.vorhand; // Erster Stich beginnt bei Vorhand
    gameState.currentPlayer = gameState.vorhand;

    // Rundennummer erhöhen
    gameState.roundNumber++;

    logGameAction('Neue Runde mit Vorhand gestartet', { 
        round: gameState.roundNumber,
        vorhand: gameState.players[gameState.vorhand].name,
        leadPlayer: gameState.players[gameState.trickLeadPlayer].name
    });

    console.log(`🆕 Runde ${gameState.roundNumber}: ${gameState.players[gameState.vorhand].name} hat Vorhand`);
}

/**
 * Bereitet die nächste Runde vor (mit Vorhand-Rotation)
 */
function prepareNextRound() {
    // Vorhand für nächste Runde rotieren
    rotateVorhand();
    
    // Neue Runde mit rotierter Vorhand starten
    startNewRoundWithVorhand();
}

/**
 * Debug-Funktion: Zeigt aktuelle Vorhand-Information
 */
function debugVorhand() {
    console.log('🎯 Vorhand-Status:');
    console.log(`Aktuelle Vorhand: ${gameState.players[gameState.vorhand].name} (Index: ${gameState.vorhand})`);
    console.log(`Runde: ${gameState.roundNumber}`);
    console.log(`Aktueller Ausspieler: ${gameState.players[gameState.trickLeadPlayer].name} (Index: ${gameState.trickLeadPlayer})`);
    
    if (gameState.vorhand !== gameState.trickLeadPlayer) {
        console.log('⚠️ Vorhand ≠ Trickführung (normal nach erstem Stich)');
    }
}

/**
 * Erweitert die initializeGameState Funktion um Vorhand-Support
 */
function initializeGameStateWithVorhand(options = {}) {
    // Basis-Initialisierung aufrufen
    if (typeof initializeGameState === 'function') {
        initializeGameState(options);
    }
    
    // Vorhand-System hinzufügen
    const startPlayer = options.startPlayer || 0;
    initializeVorhand(startPlayer);
    
    console.log('✅ Game State mit Vorhand-System initialisiert');
}

// Export für Kompatibilität
if (typeof window !== 'undefined') {
    window.initializeVorhand = initializeVorhand;
    window.rotateVorhand = rotateVorhand;
    window.startNewRoundWithVorhand = startNewRoundWithVorhand;
    window.prepareNextRound = prepareNextRound;
    window.debugVorhand = debugVorhand;
    window.initializeGameStateWithVorhand = initializeGameStateWithVorhand;
}