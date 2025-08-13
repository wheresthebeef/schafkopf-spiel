/**
 * Bayerisches Schafkopf - Spielzustand-Verwaltung
 * Verwaltet den globalen Spielzustand und bietet Funktionen für Zustandsänderungen
 */

// Globaler Spielzustand
let gameState = {
    // Spieler-Daten
    players: [],
    
    // Spielverlauf
    currentPlayer: 0,
    currentTrick: [],
    trickNumber: 0,
    completedTricks: [],
    
    // Spielmodus
    gamePhase: 'setup', // 'setup', 'bidding', 'playing', 'finished'
    gameType: 'rufspiel', // 'rufspiel', 'farbsolo', 'wenz'
    
    // Trumpf-System
    trumpSuit: 'herz',
    calledAce: null,
    
    // Partnerschaften (für Rufspiel)
    playerPartnership: [0, 1, 2, 3], // Index = Spieler, Wert = Team (0/1)
    
    // Spielstatistiken
    roundNumber: 1,
    gamesPlayed: 0,
    
    // Debug-Modus
    debugMode: true, // Standardmäßig an für Entwicklung
    
    // Spielverlauf-Log - WICHTIG: Hier schon initialisieren!
    gameLog: [],
    
    // NEU: Stich-Position Tracking
    trickLeadPlayer: 0 // Wer spielt die erste Karte des aktuellen Stichs aus
};

/**
 * Protokolliert eine Spielaktion
 * @param {string} action - Beschreibung der Aktion
 * @param {Object} data - Zusätzliche Daten
 */
function logGameAction(action, data = {}) {
    // Sicherheitsprüfung: gameLog initialisieren falls nicht vorhanden
    if (!gameState.gameLog) {
        gameState.gameLog = [];
    }
    
    const logEntry = {
        timestamp: Date.now(),
        action: action,
        data: data,
        gamePhase: gameState.gamePhase,
        currentPlayer: gameState.currentPlayer,
        trickNumber: gameState.trickNumber
    };
    
    gameState.gameLog.push(logEntry);
    
    // In Debug-Modus auch in Konsole ausgeben
    if (gameState.debugMode) {
        console.log(`[${new Date().toLocaleTimeString()}] ${action}:`, data);
    }
}

/**
 * Initialisiert einen neuen Spielzustand
 * @param {Object} options - Konfigurationsoptionen
 */
function initializeGameState(options = {}) {
    const defaults = {
        playerNames: ['Sie', 'Anna', 'Hans', 'Sepp'],
        humanPlayerIndex: 0,
        gameType: 'rufspiel',
        debugMode: true
    };
    
    const config = { ...defaults, ...options };
    
    gameState = {
        // Spieler initialisieren
        players: config.playerNames.map((name, index) => ({
            name: name,
            isHuman: index === config.humanPlayerIndex,
            cards: [],
            points: 0,
            tricks: 0,
            tricksWon: [],
            index: index
        })),
        
        // Spielverlauf zurücksetzen
        currentPlayer: 0,
        currentTrick: [],
        trickNumber: 0,
        completedTricks: [],
        
        // Spielmodus setzen
        gamePhase: 'setup',
        gameType: config.gameType,
        
        // Trumpf-System
        trumpSuit: 'herz',
        calledAce: null,
        calledAcePlayer: -1,
        calledSuitPlayed: false, // NEU: Tracking ob Ruffarbe bereits gespielt wurde
        
        // Partnerschaften
        playerPartnership: [0, 1, 2, 3],
        teamPoints: [0, 0], // Team 0 vs Team 1
        
        // Spielstatistiken
        roundNumber: 1,
        gamesPlayed: 0,
        
        // Debug und Einstellungen
        debugMode: config.debugMode,
        
        // Spielverlauf-Log - WICHTIG: Hier initialisieren!
        gameLog: [],
        
        // Timing
        lastActionTime: Date.now(),
        
        // NEU: Stich-Position Tracking
        trickLeadPlayer: 0 // Spieler nach dem Kartengeber spielt erste Karte
    };
    
    // Jetzt können wir sicher loggen, da gameLog existiert
    logGameAction('Spiel initialisiert', config);
}

/**
 * Startet eine neue Spielrunde
 */
function startNewRound() {
    // Nur Rundendaten zurücksetzen, Spieler behalten
    gameState.currentPlayer = 0;
    gameState.currentTrick = [];
    gameState.trickNumber = 0;
    gameState.completedTricks = [];
    gameState.gamePhase = 'playing';
    
    // Ruffarbe-Tracking zurücksetzen
    gameState.calledSuitPlayed = false;
    
    // NEU: Ausspieler für ersten Stich setzen (Spieler nach dem Kartengeber)
    gameState.trickLeadPlayer = (gameState.roundNumber) % 4; // Kartengeber rotiert
    gameState.currentPlayer = gameState.trickLeadPlayer;
    
    // Spieler-Rundendaten zurücksetzen
    gameState.players.forEach(player => {
        player.cards = [];
        player.points = 0;
        player.tricks = 0;
        player.tricksWon = [];
    });
    
    // Team-Punkte zurücksetzen
    gameState.teamPoints = [0, 0];
    
    // Rundennummer erhöhen
    gameState.roundNumber++;
    
    logGameAction('Neue Runde gestartet', { 
        round: gameState.roundNumber,
        leadPlayer: gameState.players[gameState.trickLeadPlayer].name
    });
}

/**
 * Setzt den aktuellen Spieler
 * @param {number} playerIndex - Index des Spielers
 */
function setCurrentPlayer(playerIndex) {
    if (playerIndex >= 0 && playerIndex < gameState.players.length) {
        gameState.currentPlayer = playerIndex;
        logGameAction('Spielerwechsel', { 
            player: gameState.players[playerIndex].name,
            index: playerIndex 
        });
    }
}

/**
 * Wechselt zum nächsten Spieler
 * @returns {number} Index des neuen aktuellen Spielers
 */
function nextPlayer() {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
    return gameState.currentPlayer;
}

/**
 * NEU: Ermittelt die strategische Position eines Spielers im aktuellen Stich
 * @param {number} playerIndex - Index des Spielers
 * @returns {string} Position: 'ausspieler', 'zweiter', 'dritter', 'letzter'
 */
function getTrickPosition(playerIndex) {
    // Finde die Position relativ zum Ausspieler
    const leadPlayerIndex = gameState.trickLeadPlayer;
    const playersInGame = gameState.players.length;
    
    // Berechne relative Position zum Ausspieler
    let relativePosition = (playerIndex - leadPlayerIndex + playersInGame) % playersInGame;
    
    const positions = ['ausspieler', 'zweiter', 'dritter', 'letzter'];
    return positions[relativePosition] || 'unknown';
}

/**
 * NEU: Ermittelt die strategische Position basierend auf bereits gespielten Karten
 * @param {number} playerIndex - Index des Spielers
 * @returns {string} Aktuelle Position im Stich
 */
function getCurrentTrickPosition(playerIndex) {
    const cardsPlayed = gameState.currentTrick.length;
    
    // Wenn der Stich leer ist, prüfe ob dieser Spieler der Ausspieler ist
    if (cardsPlayed === 0) {
        return playerIndex === gameState.trickLeadPlayer ? 'ausspieler' : 'unknown';
    }
    
    // Finde Position basierend auf Reihenfolge im aktuellen Stich
    const leadPlayerIndex = gameState.trickLeadPlayer;
    const playersInGame = gameState.players.length;
    
    // Berechne welcher Spieler als nächstes dran ist
    const nextPlayerIndex = (leadPlayerIndex + cardsPlayed) % playersInGame;
    
    if (playerIndex === nextPlayerIndex) {
        const positions = ['ausspieler', 'zweiter', 'dritter', 'letzter'];
        return positions[cardsPlayed] || 'unknown';
    }
    
    return 'not_turn';
}

/**
 * NEU: Gibt die strategische Beschreibung einer Stich-Position zurück
 * @param {string} position - Position ('ausspieler', 'zweiter', etc.)
 * @returns {string} Strategische Beschreibung
 */
function getPositionDescription(position) {
    const descriptions = {
        'ausspieler': 'Spielt erste Karte (blind), bestimmt Tempo',
        'zweiter': 'Reagiert auf Ausspieler, kann Farbe/Trump signalisieren', 
        'dritter': 'Sieht 2 Karten, taktische Position, kann überstechen',
        'letzter': 'Sieht alle 3 Karten, kann optimal entscheiden'
    };
    
    return descriptions[position] || 'Unbekannte Position';
}

/**
 * Fügt eine Karte zum aktuellen Stich hinzu (ERWEITERT: mit Stich-Position)
 * @param {Object} card - Die gespielte Karte
 * @param {number} playerIndex - Spieler der die Karte gespielt hat
 */
function addCardToTrick(card, playerIndex) {
    const stichPosition = getCurrentTrickPosition(playerIndex);
    const trickCard = {
        card: card,
        player: playerIndex,
        playerName: gameState.players[playerIndex].name,
        position: gameState.currentTrick.length, // Reihenfolge im Stich (0-3)
        stichPosition: stichPosition, // NEU: Strategische Position
        trickNumber: gameState.trickNumber + 1 // NEU: Aktueller Stich (1-8)
    };
    
    gameState.currentTrick.push(trickCard);
    
    logGameAction('Karte gespielt', {
        player: gameState.players[playerIndex].name,
        card: `${card.symbol}${card.short}`,
        trickPosition: trickCard.position,
        stichPosition: stichPosition, // NEU
        trickNumber: trickCard.trickNumber // NEU
    });
}

/**
 * Beendet den aktuellen Stich und ermittelt den Gewinner (ERWEITERT: Ausspieler-Update)
 * @returns {Object} Stich-Ergebnis mit Gewinner und Punkten
 */
function completeTrick() {
    if (gameState.currentTrick.length !== 4) {
        console.warn('Stich unvollständig:', gameState.currentTrick.length, 'Karten');
        return null;
    }
    
    // Höchste Karte und Gewinner ermitteln
    let winner = 0;
    let highestCard = gameState.currentTrick[0].card;
    
    for (let i = 1; i < gameState.currentTrick.length; i++) {
        const currentCard = gameState.currentTrick[i].card;
        if (isCardHigher(currentCard, highestCard)) {
            highestCard = currentCard;
            winner = i;
        }
    }
    
    const winnerPlayerIndex = gameState.currentTrick[winner].player;
    const trickPoints = countPoints(gameState.currentTrick.map(tc => tc.card));
    
    // Punkte zum Gewinner hinzufügen
    gameState.players[winnerPlayerIndex].points += trickPoints;
    gameState.players[winnerPlayerIndex].tricks += 1;
    gameState.players[winnerPlayerIndex].tricksWon.push([...gameState.currentTrick]);
    
    // Stich zu abgeschlossenen Stichen hinzufügen
    const completedTrick = {
        cards: [...gameState.currentTrick],
        winner: winnerPlayerIndex,
        winnerName: gameState.players[winnerPlayerIndex].name,
        points: trickPoints,
        trickNumber: gameState.trickNumber
    };
    
    gameState.completedTricks.push(completedTrick);
    
    logGameAction('Stich beendet', {
        winner: gameState.players[winnerPlayerIndex].name,
        points: trickPoints,
        trickNumber: gameState.trickNumber
    });
    
    // NEU: Stichgewinner wird neuer Ausspieler für nächsten Stich
    gameState.trickLeadPlayer = winnerPlayerIndex;
    
    // Für nächsten Stich vorbereiten
    gameState.currentTrick = [];
    gameState.trickNumber++;
    gameState.currentPlayer = winnerPlayerIndex; // Stichgewinner beginnt
    
    return completedTrick;
}

/**
 * Prüft ob das Spiel beendet ist
 * @returns {boolean} true wenn alle Stiche gespielt wurden
 */
function isGameFinished() {
    return gameState.trickNumber >= 8;
}

/**
 * Beendet das aktuelle Spiel und ermittelt Gewinner (KORRIGIERT: Berücksichtigt Rufspiel-Teams)
 * @returns {Object} Spielergebnis
 */
function finishGame() {
    gameState.gamePhase = 'finished';
    gameState.gamesPlayed++;
    
    let result;
    
    // Korrekte Team-basierte Auswertung für Rufspiel
    if (gameState.gameType === 'rufspiel' && gameState.calledAcePlayer >= 0) {
        // Team-Punkte berechnen
        const team0Points = gameState.players
            .filter((p, i) => gameState.playerPartnership[i] === 0)
            .reduce((sum, p) => sum + p.points, 0);
        const team1Points = gameState.players
            .filter((p, i) => gameState.playerPartnership[i] === 1)
            .reduce((sum, p) => sum + p.points, 0);
        
        const teamWins = team0Points >= 61;
        
        result = {
            humanPoints: gameState.players[0].points, // Individuelle Punkte für Kompatibilität
            cpuPoints: gameState.players.slice(1).reduce((sum, p) => sum + p.points, 0),
            humanWins: teamWins, // Basiert jetzt auf Team-Ergebnis!
            teamPoints: [team0Points, team1Points],
            gameType: gameState.gameType,
            roundNumber: gameState.roundNumber,
            tricksPlayed: gameState.trickNumber,
            isTeamGame: true
        };
    } else {
        // Vereinfachte Gewinner-Ermittlung für andere Spieltypen
        const humanPlayer = gameState.players[0];
        const cpuPoints = gameState.players.slice(1).reduce((sum, p) => sum + p.points, 0);
        
        result = {
            humanPoints: humanPlayer.points,
            cpuPoints: cpuPoints,
            humanWins: humanPlayer.points >= 61,
            gameType: gameState.gameType,
            roundNumber: gameState.roundNumber,
            tricksPlayed: gameState.trickNumber,
            isTeamGame: false
        };
    }
    
    logGameAction('Spiel beendet', result);
    
    return result;
}

/**
 * Setzt den Debug-Modus
 * @param {boolean} enabled - true für Debug-Modus aktiviert
 */
function setDebugMode(enabled) {
    gameState.debugMode = enabled;
    logGameAction('Debug-Modus geändert', { enabled });
    
    // CSS-Klasse für Debug-Modus setzen/entfernen
    if (typeof document !== 'undefined') {
        document.body.classList.toggle('debug-mode', enabled);
    }
}

/**
 * Gibt den aktuellen Spielzustand zurück (Kopie für Sicherheit)
 * @returns {Object} Kopie des Spielzustands
 */
function getGameState() {
    return JSON.parse(JSON.stringify(gameState));
}

/**
 * Gibt Spieler-Informationen zurück
 * @param {number} playerIndex - Index des Spielers
 * @returns {Object} Spieler-Objekt
 */
function getPlayer(playerIndex) {
    if (playerIndex >= 0 && playerIndex < gameState.players.length) {
        return gameState.players[playerIndex];
    }
    return null;
}

/**
 * Gibt den aktuellen Spieler zurück
 * @returns {Object} Aktueller Spieler
 */
function getCurrentPlayer() {
    return gameState.players[gameState.currentPlayer];
}

/**
 * Prüft ob ein Spieler am Zug ist
 * @param {number} playerIndex - Index des Spielers
 * @returns {boolean} true wenn der Spieler am Zug ist
 */
function isPlayerTurn(playerIndex) {
    return gameState.currentPlayer === playerIndex;
}

/**
 * Gibt Statistiken über das aktuelle Spiel zurück
 * @returns {Object} Spielstatistiken
 */
function getGameStats() {
    const totalPoints = gameState.players.reduce((sum, p) => sum + p.points, 0);
    const totalTricks = gameState.players.reduce((sum, p) => sum + p.tricks, 0);
    
    return {
        totalPoints,
        totalTricks,
        tricksRemaining: 8 - gameState.trickNumber,
        gamePhase: gameState.gamePhase,
        roundNumber: gameState.roundNumber,
        gamesPlayed: gameState.gamesPlayed,
        players: gameState.players.map(p => ({
            name: p.name,
            points: p.points,
            tricks: p.tricks,
            isHuman: p.isHuman
        }))
    };
}

/**
 * Exportiert das Spiellog für Debugging
 * @returns {Array} Komplettes Spiellog
 */
function exportGameLog() {
    return [...gameState.gameLog];
}

/**
 * Setzt einen Checkpoint des Spielzustands (für Undo-Funktionalität)
 * @param {string} label - Label für den Checkpoint
 */
function saveCheckpoint(label) {
    if (!gameState.checkpoints) {
        gameState.checkpoints = [];
    }
    
    gameState.checkpoints.push({
        label,
        timestamp: Date.now(),
        state: JSON.parse(JSON.stringify(gameState))
    });
    
    // Nur die letzten 5 Checkpoints behalten
    if (gameState.checkpoints.length > 5) {
        gameState.checkpoints.shift();
    }
    
    logGameAction('Checkpoint gespeichert', { label });
}

/**
 * NEU: Debug-Funktion für Stich-Positionen
 */
function debugTrickPositions() {
    console.log('🎯 Aktuelle Stich-Positionen:');
    console.log(`Ausspieler: ${gameState.players[gameState.trickLeadPlayer].name}`);
    
    gameState.players.forEach((player, index) => {
        const position = getTrickPosition(index);
        const currentPosition = getCurrentTrickPosition(index);
        const description = getPositionDescription(position);
        
        console.log(`${player.name}: ${position} (${description})`);
        if (currentPosition !== position && currentPosition !== 'not_turn') {
            console.log(`  → Aktuell: ${currentPosition}`);
        }
    });
    
    if (gameState.currentTrick.length > 0) {
        console.log('\nBereits gespielte Karten:');
        gameState.currentTrick.forEach(tc => {
            console.log(`  ${tc.playerName}: ${tc.card.symbol}${tc.card.short} (${tc.stichPosition})`);
        });
    }
}
