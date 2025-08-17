/**
 * Zeigt den "Weiter"-Button nach einem abgeschlossenen Stich
 */
function showContinueButton() {
    // Prüfen ob bereits ein Continue-Button existiert
    let continueContainer = document.getElementById('continue-container');
    if (!continueContainer) {
        // Container für Continue-Button erstellen
        continueContainer = document.createElement('div');
        continueContainer.id = 'continue-container';
        continueContainer.className = 'continue-container';
        
        // In die Mitte des Spielfelds einfügen
        const centerArea = document.querySelector('.center-area');
        if (centerArea) {
            centerArea.appendChild(continueContainer);
        }
    }
    
    // Button-Text abhängig vom Spielstand
    const isLastTrick = isGameFinished();
    const buttonText = isLastTrick ? 'Endergebnis anzeigen' : 'Weiter zur nächsten Runde';
    const statusText = isLastTrick ? 'Spiel beendet!' : 'Stich abgeschlossen';
    
    continueContainer.innerHTML = `
        <div class="continue-status">
            <strong>🎯 ${statusText}</strong>
        </div>
        <button class="btn btn-continue" onclick="continueAfterTrick()">
            ${buttonText}
        </button>
    `;
    
    continueContainer.style.display = 'block';
}

/**
 * Entfernt den "Weiter"-Button
 */
function hideContinueButton() {
    const continueContainer = document.getElementById('continue-container');
    if (continueContainer) {
        continueContainer.style.display = 'none';
    }
}

/**
 * Wird aufgerufen wenn der "Weiter"-Button geklickt wird
 */
function continueAfterTrick() {
    // Continue-Button verstecken
    hideContinueButton();
    
    // Prüfen ob Spiel beendet
    if (isGameFinished()) {
        // Spiel beendet - Endergebnis anzeigen
        endGame();
    } else {
        // Nächster Stich - UI leeren und fortfahren
        // Der currentTrick wurde bereits in completeTrick() geleert
        updateUI();
        updateGameStatus();
        
        // Nächster Spieler (Stichgewinner) kann jetzt spielen
        if (!getCurrentPlayer().isHuman) {
            setTimeout(playCPUCard, 1000);
        }
    }
}/**
 * Bayerisches Schafkopf - Hauptspiel-Logik
 * Koordiniert Spielverlauf, Regeln und Benutzerinteraktionen
 * BIDDING-MODAL ONLY (Legacy Ass-Auswahl entfernt)
 */

/**
 * Startet ein neues Spiel - delegiert an Bidding-System
 */
function newGame() {
    logGameAction('Neues Spiel gestartet');
    
    // Continue-Button verstecken falls noch sichtbar
    hideContinueButton();

    // Spielzustand initialisieren (Vorhand-System ist bereits integriert!)
    initializeGameState({
        debugMode: gameState?.debugMode || true
    });
    
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
    
    // Spielphase auf Bidding setzen (nicht spielen)
    gameState.gamePhase = 'bidding';
    gameState.currentPlayer = gameState.vorhand; // Vorhand beginnt
    
    // UI aktualisieren
    updateUI();
    updateGameStatus('Bidding-Phase startet...');
    
    // BIDDING-SYSTEM: Wird durch Bidding-Modal gehandhabt
    // Legacy Ass-Auswahl entfernt - Bidding-Modal übernimmt!
    console.log('🎯 Bidding-System übernimmt - keine Legacy Ass-Auswahl mehr');
    
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

/**
 * Startet das eigentliche Spiel nach dem Bidding
 * Wird vom Bidding-System aufgerufen
 */
function startGameAfterBidding(gameType, calledAce = null) {
    gameState.gamePhase = 'playing';
    gameState.gameType = gameType;
    
    if (gameType === 'rufspiel' && calledAce) {
        gameState.calledAce = calledAce;
        gameState.calledSuitPlayed = false;
        
        // Partner finden
        findPartnerWithAce(calledAce);
    }
    
    // Vorhand beginnt
    const vorhandPlayer = getCurrentVorhand();
    gameState.currentPlayer = vorhandPlayer;
    gameState.trickLeadPlayer = vorhandPlayer;
    
    console.log(`🎯 Spiel startet mit Vorhand: ${gameState.players[vorhandPlayer].name}`);
    
    updateUI();
    
    const currentPlayerName = gameState.players[gameState.currentPlayer].name;
    updateGameStatus(`${gameType} gestartet - ${currentPlayerName} beginnt!`);
    
    if (gameState.debugMode && gameState.calledAcePlayer >= 0) {
        const partnerName = gameState.players[gameState.calledAcePlayer].name;
        showToast(`Ihr Partner: ${partnerName}`, 3000);
    }
    
    // CPU-Spieler automatisch spielen lassen wenn nicht menschlicher Spieler beginnt
    if (!getCurrentPlayer().isHuman) {
        setTimeout(playCPUCard, 1500);
    }
}

/**
 * Findet den Partner anhand des gerufenen Asses
 * @param {string} suit - Farbe des gerufenen Asses
 */
function findPartnerWithAce(suit) {
    for (let i = 1; i < gameState.players.length; i++) {
        const hasAce = gameState.players[i].cards.some(card => 
            card.suit === suit && card.value === 'sau'
        );
        
        if (hasAce) {
            gameState.calledAcePlayer = i;
            
            // Partnerschaft setzen: Sie (0) und Partner (i) = Team 0, alle anderen = Team 1
            gameState.playerPartnership[0] = 0;
            gameState.playerPartnership[1] = (i === 1) ? 0 : 1;
            gameState.playerPartnership[2] = (i === 2) ? 0 : 1;
            gameState.playerPartnership[3] = (i === 3) ? 0 : 1;
            
            if (gameState.debugMode) {
                const suitNames = {
                    'eichel': 'Eichel',
                    'gras': 'Gras',
                    'schellen': 'Schellen',
                    'herz': 'Herz'
                };
                console.log(`Partner gefunden: ${gameState.players[i].name} hat ${suitNames[suit]}-Ass`);
                console.log('Team-Zuordnung:', gameState.playerPartnership);
            }
            return;
        }
    }
    
    // Sollte nicht passieren, aber Fallback
    console.warn('Gerufenes Ass nicht gefunden!');
    gameState.calledAcePlayer = -1;
}

/**
 * Initialisiert das Spiel beim Laden der Seite
 */
function initializeGame() {
    console.log('🃏 Bayerisches Schafkopf wird geladen...');
    
    // Event-Listener für Fenstergröße
    window.addEventListener('resize', handleResize);
    
    // Erstes Spiel starten
    newGame();
    
    console.log('✅ Spiel erfolgreich geladen!');
    
    // Willkommensnachricht
    setTimeout(() => {
        if (gameState?.debugMode) {
            showToast('Debug-Modus ist aktiv - alle Karten sind sichtbar', 3000);
        }
        
        console.log('🔄 Vorhand-System Status nach Spiel-Initialisierung:');
        debugVorhand();
    }, 1000);
}

// MINIMAL-VERSION: Nur die essentiellen Funktionen für Platzhalter

function playCard(suit, value) { /* Bestehende Implementierung */ }
function playCPUCard() { /* Bestehende Implementierung */ }  
function evaluateTrick() { /* Bestehende Implementierung */ }
function endGame() { /* Bestehende Implementierung */ }
function showRules() { /* Bestehende Implementierung */ }
function showStats() { /* Bestehende Implementierung */ }
function toggleDebugMode() { /* Bestehende Implementierung */ }
function toggleCardImages() { /* Bestehende Implementierung */ }
function canPlayCard(card, playerIndex) { /* Bestehende Implementierung */ }
function selectCardWithAI(playableCards, playerIndex) { /* Bestehende Implementierung */ }
function handleResize() { /* Bestehende Implementierung */ }
function exportGameData() { /* Bestehende Implementierung */ }
function importGameData(data) { /* Bestehende Implementierung */ }

// Spiel beim Laden der Seite initialisieren
if (typeof window !== 'undefined') {
    window.addEventListener('load', initializeGame);
}

// Globale Funktionen für HTML-Events verfügbar machen
if (typeof window !== 'undefined') {
    window.newGame = newGame;
    window.showRules = showRules;
    window.showStats = showStats;
    window.toggleDebugMode = toggleDebugMode;
    window.toggleCardImages = toggleCardImages;
    window.closeModal = closeModal;
    window.handleCardClick = handleCardClick;
    window.handleImageError = handleImageError;
    window.debugUI = debugUI;
    window.exportGameData = exportGameData;
    window.importGameData = importGameData;
    
    // Neue Funktion für Continue-Button
    window.continueAfterTrick = continueAfterTrick;
    
    // Neue Funktion für Bidding-Integration
    window.startGameAfterBidding = startGameAfterBidding;
}