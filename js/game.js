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
    for (let i = 0; i < gameState.players.length; i++) {
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

/**
 * ECHTE IMPLEMENTIERUNG: Spielt eine Karte
 * @param {string} suit - Farbe der Karte
 * @param {string} value - Wert der Karte
 */
function playCard(suit, value) {
    console.log(`🎮 playCard: Spiele ${suit} ${value}`);
    
    // Aktueller Spieler
    const player = getCurrentPlayer();
    
    // Karte finden und entfernen
    const card = player.cards.find(c => c.suit === suit && c.value === value);
    if (!card) {
        console.error('Karte nicht in Spielerhand gefunden!');
        return;
    }
    
    // Karte aus Hand entfernen
    const cardIndex = player.cards.indexOf(card);
    player.cards.splice(cardIndex, 1);
    
    // Karte zum Stich hinzufügen
    addCardToTrick(card, gameState.currentPlayer);
    
    // UI aktualisieren
    updateUI();
    
    console.log(`🎮 ${player.name} spielt: ${card.symbol}${card.short}`);
    
    // Prüfen ob Stich vollständig
    if (gameState.currentTrick.length === 4) {
        // Stich auswerten
        evaluateTrick();
    } else {
        // Nächster Spieler
        nextPlayer();
        
        // CPU automatisch spielen lassen
        if (!getCurrentPlayer().isHuman) {
            setTimeout(playCPUCard, 1500);
        }
    }
}

/**
 * ECHTE IMPLEMENTIERUNG: CPU spielt eine Karte
 */
function playCPUCard() {
    const player = getCurrentPlayer();
    
    if (player.isHuman) {
        console.warn('playCPUCard für menschlichen Spieler aufgerufen!');
        return;
    }
    
    console.log(`🤖 ${player.name} denkt...`);
    
    // Spielbare Karten ermitteln
    const playableCards = player.cards.filter(card => 
        canPlayCard(card, player.index)
    );
    
    if (playableCards.length === 0) {
        console.error(`${player.name} hat keine spielbaren Karten!`);
        return;
    }
    
    // KI-Entscheidung
    const selectedCard = selectCardWithAI(playableCards, player.index);
    
    if (selectedCard) {
        playCard(selectedCard.suit, selectedCard.value);
    } else {
        // Fallback: Erste spielbare Karte
        playCard(playableCards[0].suit, playableCards[0].value);
    }
}

/**
 * ECHTE IMPLEMENTIERUNG: Wertet einen vollständigen Stich aus
 */
function evaluateTrick() {
    const trickResult = completeTrick();
    
    if (!trickResult) {
        console.error('Fehler beim Abschließen des Stichs');
        return;
    }
    
    console.log(`🏆 Stich ${trickResult.trickNumber}: ${trickResult.winnerName} gewinnt mit ${trickResult.points} Punkten`);
    
    // UI-Update nach kurzer Verzögerung für Übersicht
    setTimeout(() => {
        updateUI();
        
        // Prüfen ob Spiel beendet
        if (isGameFinished()) {
            endGame();
        } else {
            // Continue-Button anzeigen
            showContinueButton();
        }
    }, 1000);
}

/**
 * ECHTE IMPLEMENTIERUNG: Beendet das Spiel
 */
function endGame() {
    const result = finishGame();
    
    console.log('🏁 Spiel beendet:', result);
    
    // Endergebnis anzeigen
    const message = result.humanWins ? 
        `🎉 Sie haben gewonnen! (${result.humanPoints} Punkte)` :
        `😔 Sie haben verloren. (${result.humanPoints} Punkte)`;
    
    showModal('Spiel beendet', message);
    
    // Nach kurzer Zeit neues Spiel anbieten
    setTimeout(() => {
        if (confirm('Neues Spiel starten?')) {
            newGame();
        }
    }, 3000);
}

/**
 * ECHTE IMPLEMENTIERUNG: Zeigt Regeln an
 */
function showRules() {
    const rulesText = `
        <h3>Bayerisches Schafkopf - Regeln</h3>
        <p><strong>Trumpf-Reihenfolge:</strong><br>
        Ober (höchster) → Unter → Herz-Karten (niedrigster Trumpf)</p>
        
        <p><strong>Rufspiel:</strong><br>
        Sie rufen ein Ass und spielen mit dem Partner, der diese Karte hat.</p>
        
        <p><strong>Punkte:</strong><br>
        Ass = 11, Zehn = 10, König = 4, Ober = 3, Unter = 2</p>
        
        <p><strong>Ziel:</strong><br>
        61 von 120 Punkten erreichen</p>
    `;
    
    showModal('Spielregeln', rulesText);
}

/**
 * ECHTE IMPLEMENTIERUNG: Zeigt Statistiken an
 */
function showStats() {
    const stats = getGameStats();
    
    const statsText = `
        <h3>Spielstatistiken</h3>
        <p><strong>Aktuelle Runde:</strong> ${stats.roundNumber}</p>
        <p><strong>Gespielte Spiele:</strong> ${stats.gamesPlayed}</p>
        <p><strong>Aktuelle Punkte:</strong></p>
        <ul>
            ${stats.players.map(p => 
                `<li>${p.name}: ${p.points} Punkte (${p.tricks} Stiche)</li>`
            ).join('')}
        </ul>
    `;
    
    showModal('Statistiken', statsText);
}

/**
 * ECHTE IMPLEMENTIERUNG: Schaltet Debug-Modus um
 */
function toggleDebugMode() {
    setDebugMode(!gameState.debugMode);
    updateUI();
    
    const status = gameState.debugMode ? 'aktiviert' : 'deaktiviert';
    showToast(`Debug-Modus ${status}`, 2000);
}

/**
 * ECHTE IMPLEMENTIERUNG: Schaltet Kartenbilder um
 */
function toggleCardImages() {
    const currentMode = shouldUseCardImages();
    setCardImagesMode(!currentMode);
}

/**
 * ECHTE IMPLEMENTIERUNG: Fenster-Resize Handler
 */
function handleResize() {
    // UI an neue Fenstergröße anpassen
    updateUI();
}

/**
 * ECHTE IMPLEMENTIERUNG: Exportiert Spieldaten
 */
function exportGameData() {
    const data = {
        gameState: getGameState(),
        timestamp: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `schafkopf-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Spieldaten exportiert', 2000);
}

/**
 * ECHTE IMPLEMENTIERUNG: Importiert Spieldaten
 */
function importGameData(data) {
    try {
        const imported = JSON.parse(data);
        
        if (imported.gameState && imported.version) {
            Object.assign(gameState, imported.gameState);
            updateUI();
            showToast('Spieldaten importiert', 2000);
        } else {
            throw new Error('Ungültiges Datenformat');
        }
    } catch (error) {
        console.error('Import-Fehler:', error);
        showToast('Import fehlgeschlagen', 2000);
    }
}

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
    
    // ECHTE GAME FUNCTIONS EXPORTIERT
    window.playCard = playCard;
    window.playCPUCard = playCPUCard;
    window.evaluateTrick = evaluateTrick;
    window.endGame = endGame;
    
    console.log('🔧 Game.js: ECHTE Funktionen exportiert!');
}