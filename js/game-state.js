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
    
    // Spielverlauf-Log
    gameLog: [],
    
    // Stich-Position Tracking
    trickLeadPlayer: 0, // Wer spielt die erste Karte des aktuellen Stichs aus
    
    // VORHAND-SYSTEM: Einfach und direkt integriert
    vorhand: 0, // Wer beginnt die aktuelle Runde (rotiert zwischen Runden)
    
    // BIDDING-SYSTEM: Wer kann bieten und was wurde geboten
    bidding: {
        currentBidder: 0,           // Wer ist aktuell dran mit bieten
        biddingOrder: [0, 1, 2, 3], // Reihenfolge des Bietens (startet mit Vorhand)
        playerBids: [null, null, null, null], // Was hat jeder Spieler geboten? null = noch nicht dran, 'pass' = gepasst, 'rufspiel' = Rufspiel angesagt
        activeBidder: -1,           // Wer hat ein Spiel angesagt? -1 = noch niemand
        biddingFinished: false      // Ist die Bietphase abgeschlossen?
    }
};