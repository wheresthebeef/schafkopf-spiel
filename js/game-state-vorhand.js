/**
 * Vorhand-Rotation System für Schafkopf
 * Erweitert game-state.js um korrekte Runden-Rotation
 */

/**
 * Initialisiert das Vorhand-System
 * @param {number} startPlayer - Spieler der die erste Runde beginnt (default: 0 = Mensch)
 */
function initializeVorhand(startPlayer = 0) {
    // Sicherstellen dass gameState und players existieren
    if (!window.gameState) {
        console.warn('⚠️ gameState nicht verfügbar, Vorhand-System wartet...');
        return;
    }
    
    if (!gameState.players || gameState.players.length === 0) {
        console.warn('⚠️ Spieler nicht initialisiert, Vorhand-System wartet...');
        return;
    }
    
    // Neue Vorhand-Tracking Eigenschaften
    gameState.vorhand = startPlayer; // Wer beginnt die aktuelle Runde
    gameState.initialVorhand = startPlayer; // Ursprünglicher Startspieler
    
    console.log(`🎯 Vorhand initialisiert: ${gameState.players[startPlayer].name} beginnt`);
}

/**
 * Gibt den aktuellen Vorhand-Spieler zurück
 * @returns {number|null} Index des Vorhand-Spielers oder null wenn nicht initialisiert
 */
function getCurrentVorhand() {
    if (!window.gameState || !gameState.players || gameState.players.length === 0) {
        console.warn('⚠️ Spieler nicht verfügbar für getCurrentVorhand()');
        return null;
    }
    
    if (gameState.vorhand === undefined) {
        console.warn('⚠️ Vorhand-System nicht initialisiert');
        return null;
    }
    
    return gameState.vorhand;
}

/**
 * Gibt den Namen des aktuellen Vorhand-Spielers zurück  
 * @returns {string|null} Name des Vorhand-Spielers oder null
 */
function getCurrentVorhandName() {
    const vorhandIndex = getCurrentVorhand();
    if (vorhandIndex === null) return null;
    
    return gameState.players[vorhandIndex]?.name || null;
}

/**
 * Rotiert die Vorhand zum nächsten Spieler (Uhrzeigersinn)
 */
function rotateVorhand() {
    if (!gameState || !gameState.players || gameState.players.length === 0) {
        console.warn('⚠️ Kann Vorhand nicht rotieren - Spieler nicht verfügbar');
        return;
    }
    
    const previousVorhand = gameState.vorhand;
    gameState.vorhand = (gameState.vorhand + 1) % gameState.players.length;
    
    console.log(`🔄 Vorhand rotiert: ${gameState.players[previousVorhand].name} → ${gameState.players[gameState.vorhand].name}`);
    
    if (typeof logGameAction === 'function') {
        logGameAction('Vorhand rotiert', {
            previousVorhand: gameState.players[previousVorhand].name,
            newVorhand: gameState.players[gameState.vorhand].name,
            round: gameState.roundNumber
        });
    }
}

/**
 * Startet eine neue Runde mit korrekter Vorhand-Rotation
 */
function startNewRoundWithVorhand() {
    if (!gameState || !gameState.players || gameState.players.length === 0) {
        console.warn('⚠️ Kann Runde nicht starten - Spieler nicht verfügbar');
        return;
    }
    
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

    if (typeof logGameAction === 'function') {
        logGameAction('Neue Runde mit Vorhand gestartet', { 
            round: gameState.roundNumber,
            vorhand: gameState.players[gameState.vorhand].name,
            leadPlayer: gameState.players[gameState.trickLeadPlayer].name
        });
    }

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
    if (!window.gameState) {
        console.log('❌ gameState nicht verfügbar');
        return { error: 'gameState nicht verfügbar' };
    }
    
    if (!gameState.players || gameState.players.length === 0) {
        console.log('❌ Spieler nicht initialisiert');
        return { error: 'Spieler nicht initialisiert' };
    }
    
    if (gameState.vorhand === undefined) {
        console.log('❌ Vorhand-System nicht initialisiert');
        return { error: 'Vorhand-System nicht initialisiert' };
    }
    
    console.log('🎯 Vorhand-Status:');
    console.log(`Aktuelle Vorhand: ${gameState.players[gameState.vorhand].name} (Index: ${gameState.vorhand})`);
    console.log(`Runde: ${gameState.roundNumber}`);
    console.log(`Aktueller Ausspieler: ${gameState.players[gameState.trickLeadPlayer].name} (Index: ${gameState.trickLeadPlayer})`);
    
    if (gameState.vorhand !== gameState.trickLeadPlayer) {
        console.log('⚠️ Vorhand ≠ Trickführung (normal nach erstem Stich)');
    }
    
    return {
        vorhand: gameState.vorhand,
        vorhandName: gameState.players[gameState.vorhand].name,
        trickLeadPlayer: gameState.trickLeadPlayer,
        trickLeadPlayerName: gameState.players[gameState.trickLeadPlayer].name,
        round: gameState.roundNumber,
        status: 'OK'
    };
}

/**
 * Erweitert die initializeGameState Funktion um Vorhand-Support
 */
function initializeGameStateWithVorhand(options = {}) {
    // Basis-Initialisierung aufrufen
    if (typeof initializeGameState === 'function') {
        initializeGameState(options);
    }
    
    // Warte kurz und initialisiere dann Vorhand-System
    setTimeout(() => {
        const startPlayer = options.startPlayer || 0;
        initializeVorhand(startPlayer);
        console.log('✅ Game State mit Vorhand-System initialisiert');
    }, 100);
}

/**
 * Sichere Initialisierung des Vorhand-Systems
 * Wartet bis gameState und Spieler verfügbar sind
 */
function ensureVorhandSystem() {
    if (!window.gameState) {
        console.log('⏳ Warte auf gameState...');
        setTimeout(ensureVorhandSystem, 250);
        return;
    }
    
    if (!gameState.players || gameState.players.length === 0) {
        console.log('⏳ Warte auf Spieler...');
        setTimeout(ensureVorhandSystem, 250);
        return;
    }
    
    if (gameState.vorhand === undefined) {
        console.log('🔄 Initialisiere Vorhand-System...');
        initializeVorhand(0);
    }
}

// Auto-Initialisierung nach DOM-Load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(ensureVorhandSystem, 500);
    });
}

// Export für Kompatibilität
if (typeof window !== 'undefined') {
    window.initializeVorhand = initializeVorhand;
    window.getCurrentVorhand = getCurrentVorhand;
    window.getCurrentVorhandName = getCurrentVorhandName;
    window.rotateVorhand = rotateVorhand;
    window.startNewRoundWithVorhand = startNewRoundWithVorhand;
    window.prepareNextRound = prepareNextRound;
    window.debugVorhand = debugVorhand;
    window.initializeGameStateWithVorhand = initializeGameStateWithVorhand;
    window.ensureVorhandSystem = ensureVorhandSystem;
}