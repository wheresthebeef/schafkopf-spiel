/**
 * Startet ein neues Spiel (CLEAN: ohne chaotische setTimeout-Kaskaden)
 */
function newGame() {
    logGameAction('Neues Spiel gestartet');
    
    // Continue-Button verstecken falls noch sichtbar
    hideContinueButton();
    
    // Spielzustand initialisieren (Vorhand-System ist bereits integriert!)
    initializeGameState({
        debugMode: gameState?.debugMode || true
    });
    
    // CLEAN: Kein setTimeout-Chaos mehr - Vorhand ist direkt in gameState integriert!
    console.log(`🎯 Vorhand automatisch initialisiert: ${gameState.players[gameState.vorhand].name} beginnt`);
    
    // Deck erstellen und mischen
    const deck = createDeck();
    setTrumpStatus(deck);
    const shuffledDeck = shuffleDeck(deck);
    
    // Karten an Spieler verteilen
    const hands = dealCards(shuffledDeck);
    hands.forEach((hand, index) => {
        gameState.players[index].cards = hand;
    });
    
    // Spielphase auf Ass-Auswahl setzen
    gameState.gamePhase = 'bidding';
    gameState.currentPlayer = 0; // Menschlicher Spieler wählt Ass
    
    // UI aktualisieren
    updateUI();
    updateGameStatus('Wählen Sie ein Ass für das Rufspiel...');
    
    // Ass-Auswahl anzeigen
    showAceSelection();
    
    if (gameState.debugMode) {
        console.log('=== Neues Spiel ===');
        gameState.players.forEach((player, index) => {
            debugCards(player.cards, `${player.name} (${index})`);
        });
        
        // Trumpf-Reihenfolge anzeigen (nur beim ersten Spiel)
        if (!window.trumpOrderShown) {
            debugTrumpOrder(shuffledDeck);
            window.trumpOrderShown = true;
        }
        
        // Ruffarbe-Tracking zurücksetzen
        if (typeof initializeCalledSuitTracking === 'function') {
            initializeCalledSuitTracking();
        }
    }
}