/**
 * Bayerisches Schafkopf - Spielzustand-Verwaltung (Refactored)
 * Verwaltet den globalen Spielzustand mit klarer API
 */

import { GAME_PHASES, GAME_TYPES, DEFAULT_PLAYERS } from './constants.js';
import { logGameAction, generateGameId, deepClone } from './utils.js';

// Globaler Spielzustand
let gameState = {
    // Spiel-Identifikation
    gameId: null,
    
    // Spieler-Daten
    players: [],
    
    // Spielverlauf
    currentPlayer: 0,
    currentTrick: [],
    trickNumber: 0,
    completedTricks: [],
    
    // Spielmodus und -phase
    gamePhase: GAME_PHASES.SETUP,
    gameType: GAME_TYPES.RUFSPIEL.id,
    
    // Rufspiel-spezifisch
    calledAce: null,           // Farbe des gerufenen Asses
    calledAcePlayer: -1,       // Spieler der das Ass hat
    calledSuitPlayed: false,   // Wurde Ruffarbe bereits angespielt
    
    // Solo-spezifisch
    soloPlayer: -1,            // Spieler der Solo spielt
    soloSuit: null,            // Trumpf-Farbe bei Farb-Solo
    
    // Partnerschaften
    playerPartnership: [0, 1, 2, 3], // Index = Spieler, Wert = Team (0/1)
    teamPoints: [0, 0],               // Team 0 vs Team 1
    
    // Abrechnungssystem
    baseTariff: 10,            // Basis-Tarif in Cent
    currentGameValue: 0,       // Aktueller Spielwert
    laufende: [],             // Array der laufenden Trümpfe
    
    // Spielstatistiken
    roundNumber: 1,
    gamesPlayed: 0,
    
    // Einstellungen
    debugMode: true,
    useCardImages: true,
    
    // Spielverlauf-Log
    gameLog: [],
    
    // Checkpoints für Undo-Funktionalität
    checkpoints: [],
    
    // Timing
    lastActionTime: Date.now()
};

/**
 * Initialisiert einen neuen Spielzustand
 * @param {Object} options - Konfigurationsoptionen
 * @returns {Object} Initialisierter Spielzustand
 */
export function initializeGameState(options = {}) {
    const defaults = {
        playerNames: DEFAULT_PLAYERS.map(p => p.name),
        humanPlayerIndex: 0,
        gameType: GAME_TYPES.RUFSPIEL.id,
        debugMode: true,
        useCardImages: true,
        baseTariff: 10
    };
    
    const config = { ...defaults, ...options };
    
    gameState = {
        // Spiel-ID generieren
        gameId: generateGameId(),
        
        // Spieler initialisieren
        players: config.playerNames.map((name, index) => ({
            name: name,
            isHuman: index === config.humanPlayerIndex,
            difficulty: DEFAULT_PLAYERS[index]?.difficulty || 'medium',
            cards: [],
            points: 0,
            tricks: 0,
            tricksWon: [],
            index: index,
            // Erweiterte Statistiken für später
            gamesPlayed: 0,
            gamesWon: 0,
            solosPlayed: 0,
            solosWon: 0
        })),
        
        // Spielverlauf zurücksetzen
        currentPlayer: 0,
        currentTrick: [],
        trickNumber: 0,
        completedTricks: [],
        
        // Spielmodus setzen
        gamePhase: GAME_PHASES.SETUP,
        gameType: config.gameType,
        
        // Rufspiel-Daten
        calledAce: null,
        calledAcePlayer: -1,
        calledSuitPlayed: false,
        
        // Solo-Daten
        soloPlayer: -1,
        soloSuit: null,
        
        // Partnerschaften
        playerPartnership: [0, 1, 2, 3],
        teamPoints: [0, 0],
        
        // Abrechnungssystem
        baseTariff: config.baseTariff,
        currentGameValue: 0,
        laufende: [],
        
        // Spielstatistiken
        roundNumber: 1,
        gamesPlayed: 0,
        
        // Einstellungen beibehalten oder überschreiben
        debugMode: config.debugMode,
        useCardImages: config.useCardImages,
        
        // Spielverlauf-Log initialisieren
        gameLog: [],
        checkpoints: [],
        
        // Timing
        lastActionTime: Date.now()
    };
    
    // Globalen Zustand verfügbar machen
    window.gameState = gameState;
    
    logGameAction('Spiel initialisiert', config);
    return gameState;
}

/**
 * Gibt den aktuellen Spielzustand zurück (schreibgeschützte Kopie)
 * @returns {Object} Kopie des Spielzustands
 */
export function getGameState() {
    return deepClone(gameState);
}

/**
 * Gibt den internen Spielzustand zurück (für interne Module)
 * @returns {Object} Direkter Zugriff auf gameState
 */
export function getGameStateInternal() {
    return gameState;
}

/**
 * Startet eine neue Spielrunde
 */
export function startNewRound() {
    // Nur Rundendaten zurücksetzen, Spieler behalten
    gameState.currentPlayer = 0;
    gameState.currentTrick = [];
    gameState.trickNumber = 0;
    gameState.completedTricks = [];
    gameState.gamePhase = GAME_PHASES.SETUP;
    
    // Spiel-spezifische Daten zurücksetzen
    gameState.calledAce = null;
    gameState.calledAcePlayer = -1;
    gameState.calledSuitPlayed = false;
    gameState.soloPlayer = -1;
    gameState.soloSuit = null;
    
    // Spieler-Rundendaten zurücksetzen
    gameState.players.forEach(player => {
        player.cards = [];
        player.points = 0;
        player.tricks = 0;
        player.tricksWon = [];
    });
    
    // Team-Punkte zurücksetzen
    gameState.teamPoints = [0, 0];
    gameState.playerPartnership = [0, 1, 2, 3];
    
    // Abrechnungsdaten zurücksetzen
    gameState.currentGameValue = 0;
    gameState.laufende = [];
    
    // Rundennummer erhöhen
    gameState.roundNumber++;
    
    logGameAction('Neue Runde gestartet', { round: gameState.roundNumber });
}

/**
 * Getter-Funktionen für häufig verwendete Daten
 */
export function getCurrentPlayer() {
    return gameState.players[gameState.currentPlayer];
}

export function getPlayer(playerIndex) {
    return gameState.players[playerIndex] || null;
}

export function isPlayerTurn(playerIndex) {
    return gameState.currentPlayer === playerIndex;
}

export function getCurrentTrick() {
    return [...gameState.currentTrick];
}

export function getCompletedTricks() {
    return [...gameState.completedTricks];
}

/**
 * Setter-Funktionen für Spielzustand-Änderungen
 */
export function setCurrentPlayer(playerIndex) {
    if (playerIndex >= 0 && playerIndex < gameState.players.length) {
        gameState.currentPlayer = playerIndex;
        logGameAction('Spielerwechsel', { 
            player: gameState.players[playerIndex].name,
            index: playerIndex 
        });
    }
}

export function setGamePhase(phase) {
    if (Object.values(GAME_PHASES).includes(phase)) {
        const oldPhase = gameState.gamePhase;
        gameState.gamePhase = phase;
        logGameAction('Spielphase geändert', { from: oldPhase, to: phase });
    }
}

export function setGameType(gameType) {
    if (Object.values(GAME_TYPES).some(type => type.id === gameType)) {
        gameState.gameType = gameType;
        logGameAction('Spieltyp geändert', { gameType });
    }
}

export function setCalledAce(suit, playerIndex) {
    gameState.calledAce = suit;
    gameState.calledAcePlayer = playerIndex;
    gameState.calledSuitPlayed = false;
    logGameAction('Ass gerufen', { suit, playerIndex });
}

export function setSoloPlayer(playerIndex, soloSuit = null) {
    gameState.soloPlayer = playerIndex;
    gameState.soloSuit = soloSuit;
    logGameAction('Solo angesagt', { playerIndex, soloSuit });
}

export function setDebugMode(enabled) {
    gameState.debugMode = enabled;
    logGameAction('Debug-Modus geändert', { enabled });
}

/**
 * Funktionen für Spielverlauf
 */
export function nextPlayer() {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
    return gameState.currentPlayer;
}

export function addCardToTrick(card, playerIndex) {
    const trickCard = {
        card: card,
        player: playerIndex,
        playerName: gameState.players[playerIndex].name,
        position: gameState.currentTrick.length
    };
    
    gameState.currentTrick.push(trickCard);
    gameState.lastActionTime = Date.now();
    
    logGameAction('Karte gespielt', {
        player: gameState.players[playerIndex].name,
        card: `${card.symbol}${card.short}`,
        trickPosition: trickCard.position
    });
}

export function completeTrick() {
    if (gameState.currentTrick.length !== 4) {
        console.warn('Stich unvollständig:', gameState.currentTrick.length, 'Karten');
        return null;
    }
    
    // Gewinner ermitteln (wird von rules-Modul berechnet)
    const trickResult = window.determineTrickWinner(gameState.currentTrick);
    const winnerPlayerIndex = trickResult.winnerPlayerIndex;
    const trickPoints = trickResult.points;
    
    // Punkte und Stiche zum Gewinner hinzufügen
    gameState.players[winnerPlayerIndex].points += trickPoints;
    gameState.players[winnerPlayerIndex].tricks += 1;
    gameState.players[winnerPlayerIndex].tricksWon.push([...gameState.currentTrick]);
    
    // Team-Punkte aktualisieren (für Rufspiel)
    if (gameState.gameType === GAME_TYPES.RUFSPIEL.id) {
        const team = gameState.playerPartnership[winnerPlayerIndex];
        gameState.teamPoints[team] += trickPoints;
    }
    
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
    
    // Für nächsten Stich vorbereiten
    gameState.currentTrick = [];
    gameState.trickNumber++;
    gameState.currentPlayer = winnerPlayerIndex;
    
    return completedTrick;
}

/**
 * Prüfungen für Spielzustand
 */
export function isGameFinished() {
    return gameState.trickNumber >= 8;
}

export function isRufspiel() {
    return gameState.gameType === GAME_TYPES.RUFSPIEL.id;
}

export function isSolo() {
    const soloTypes = [GAME_TYPES.FARB_SOLO.id, GAME_TYPES.WENZ.id];
    return soloTypes.includes(gameState.gameType);
}

export function hasCalledSuitBeenPlayed() {
    return gameState.calledSuitPlayed === true;
}

export function markCalledSuitPlayed() {
    if (!gameState.calledSuitPlayed) {
        gameState.calledSuitPlayed = true;
        logGameAction('Ruffarbe angespielt');
    }
}

/**
 * Partnerschafts-Management
 */
export function setPlayerPartnerships(partnerships) {
    gameState.playerPartnership = [...partnerships];
    logGameAction('Partnerschaften gesetzt', { partnerships });
}

export function areTeammates(player1Index, player2Index) {
    if (!isRufspiel()) return false;
    if (!hasCalledSuitBeenPlayed()) {
        // Bei unbekannten Partnerschaften nur echte Partner erkennen
        return (player1Index === 0 && player2Index === gameState.calledAcePlayer) ||
               (player2Index === 0 && player1Index === gameState.calledAcePlayer);
    }
    return gameState.playerPartnership[player1Index] === gameState.playerPartnership[player2Index];
}

/**
 * Spielstatistiken und Ergebnisse
 */
export function getGameStats() {
    const totalPoints = gameState.players.reduce((sum, p) => sum + p.points, 0);
    const totalTricks = gameState.players.reduce((sum, p) => sum + p.tricks, 0);
    
    return {
        totalPoints,
        totalTricks,
        tricksRemaining: 8 - gameState.trickNumber,
        gamePhase: gameState.gamePhase,
        gameType: gameState.gameType,
        roundNumber: gameState.roundNumber,
        gamesPlayed: gameState.gamesPlayed,
        players: gameState.players.map(p => ({
            name: p.name,
            points: p.points,
            tricks: p.tricks,
            isHuman: p.isHuman
        })),
        teamPoints: [...gameState.teamPoints],
        gameValue: gameState.currentGameValue
    };
}

export function finishGame() {
    gameState.gamePhase = GAME_PHASES.FINISHED;
    gameState.gamesPlayed++;
    
    let result;
    
    // Team-basierte Auswertung für Rufspiel
    if (isRufspiel() && gameState.calledAcePlayer >= 0) {
        const team0Points = gameState.teamPoints[0];
        const team1Points = gameState.teamPoints[1];
        const teamWins = team0Points >= 61;
        
        result = {
            gameType: gameState.gameType,
            humanPoints: gameState.players[0].points,
            humanWins: teamWins,
            teamPoints: [...gameState.teamPoints],
            isTeamGame: true,
            roundNumber: gameState.roundNumber,
            tricksPlayed: gameState.trickNumber,
            partner: gameState.calledAcePlayer >= 0 ? 
                gameState.players[gameState.calledAcePlayer].name : null
        };
    } else {
        // Solo-Auswertung
        const soloPlayerIndex = gameState.soloPlayer >= 0 ? gameState.soloPlayer : 0;
        const soloPlayer = gameState.players[soloPlayerIndex];
        const soloWins = soloPlayer.points >= 61;
        
        result = {
            gameType: gameState.gameType,
            humanPoints: gameState.players[0].points,
            humanWins: soloPlayerIndex === 0 ? soloWins : !soloWins,
            soloPlayer: soloPlayer.name,
            soloPlayerIndex: soloPlayerIndex,
            soloPoints: soloPlayer.points,
            isTeamGame: false,
            roundNumber: gameState.roundNumber,
            tricksPlayed: gameState.trickNumber
        };
    }
    
    logGameAction('Spiel beendet', result);
    return result;
}

/**
 * Checkpoint-System für Undo-Funktionalität
 */
export function saveCheckpoint(label) {
    if (!gameState.checkpoints) {
        gameState.checkpoints = [];
    }
    
    gameState.checkpoints.push({
        label,
        timestamp: Date.now(),
        state: deepClone(gameState)
    });
    
    // Nur die letzten 5 Checkpoints behalten
    if (gameState.checkpoints.length > 5) {
        gameState.checkpoints.shift();
    }
    
    logGameAction('Checkpoint gespeichert', { label });
}

export function restoreCheckpoint(index = -1) {
    if (!gameState.checkpoints || gameState.checkpoints.length === 0) {
        return false;
    }
    
    const checkpointIndex = index >= 0 ? index : gameState.checkpoints.length - 1;
    const checkpoint = gameState.checkpoints[checkpointIndex];
    
    if (checkpoint) {
        gameState = deepClone(checkpoint.state);
        window.gameState = gameState;
        logGameAction('Checkpoint wiederhergestellt', { label: checkpoint.label });
        return true;
    }
    
    return false;
}

/**
 * Export/Import für Debugging und Speichern
 */
export function exportGameData() {
    return {
        gameState: getGameState(),
        gameLog: [...gameState.gameLog],
        timestamp: new Date().toISOString(),
        version: '0.4.0'
    };
}

export function importGameData(data) {
    try {
        if (data.gameState) {
            gameState = data.gameState;
            window.gameState = gameState;
            
            if (data.gameLog) {
                gameState.gameLog = data.gameLog;
            }
            
            logGameAction('Spielzustand importiert', { 
                version: data.version,
                timestamp: data.timestamp 
            });
            return true;
        }
    } catch (error) {
        console.error('Fehler beim Importieren:', error);
        return false;
    }
    return false;
}

/**
 * Log-Management
 */
export function exportGameLog() {
    return [...gameState.gameLog];
}

export function clearGameLog() {
    gameState.gameLog = [];
    logGameAction('Spiellog geleert');
}

/**
 * Hilfsfunktionen für Legacy-Kompatibilität
 */
export function getCalledAce() {
    return gameState.calledAce;
}

export function getCalledAcePlayer() {
    return gameState.calledAcePlayer;
}

export function getPlayerPartnership() {
    return [...gameState.playerPartnership];
}

// Globalen Zugang für Legacy-Code einrichten
if (typeof window !== 'undefined') {
    window.gameState = gameState;
    
    // Legacy-Funktionen global verfügbar machen
    window.initializeGameState = initializeGameState;
    window.getGameState = getGameState;
    window.getCurrentPlayer = getCurrentPlayer;
    window.getPlayer = getPlayer;
    window.isPlayerTurn = isPlayerTurn;
    window.nextPlayer = nextPlayer;
    window.addCardToTrick = addCardToTrick;
    window.completeTrick = completeTrick;
    window.isGameFinished = isGameFinished;
    window.finishGame = finishGame;
    window.startNewRound = startNewRound;
    window.setDebugMode = setDebugMode;
    window.getGameStats = getGameStats;
    window.exportGameLog = exportGameLog;
    window.exportGameData = exportGameData;
    window.importGameData = importGameData;
    window.saveCheckpoint = saveCheckpoint;
    window.areTeammates = areTeammates;
    window.hasCalledSuitBeenPlayed = hasCalledSuitBeenPlayed;
    window.markCalledSuitPlayed = markCalledSuitPlayed;
}
