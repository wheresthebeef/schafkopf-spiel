/**
 * Bayerisches Schafkopf - Hauptspiel-Logik
 * Koordiniert Spielverlauf, Regeln und Benutzerinteraktionen
 */

/**
 * Startet ein neues Spiel
 */
function newGame() {
    logGameAction('Neues Spiel gestartet');
    
    // Spielzustand initialisieren
    initializeGameState({
        debugMode: gameState.debugMode // Debug-Modus beibehalten
    });
    
    // Deck erstellen und mischen
    const deck = createDeck();
    setTrumpStatus(deck);
    const shuffledDeck = shuffleDeck(deck);
    
    // Karten an Spieler verteilen
    const hands = dealCards(shuffledDeck);
    hands.forEach((hand, index) => {
        gameState.players[index].cards = hand;
    });
    
    // Spielphase setzen
    gameState.gamePhase = 'playing';
    gameState.currentPlayer = 0; // Menschlicher Spieler beginnt
    
    // UI aktualisieren
    updateUI();
    updateGameStatus('Neues Spiel gestartet - Sie beginnen!');
    
    // Debug-Ausgabe
    if (gameState.debugMode) {
        console.log('=== Neues Spiel ===');
        gameState.players.forEach((player, index) => {
            debugCards(player.cards, `${player.name} (${index})`);
        });
    }
}

/**
 * Spielt eine Karte
 * @param {string} suit - Farbe der Karte
 * @param {string} value - Wert der Karte
 */
function playCard(suit, value) {
    const currentPlayer = getCurrentPlayer();
    
    // Validierung: Ist der Spieler am Zug?
    if (!currentPlayer.isHuman && gameState.currentPlayer === 0) {
        showModal('Fehler', 'Sie sind nicht am Zug!');
        return;
    }
    
    // Karte in der Hand finden
    const cardIndex = currentPlayer.cards.findIndex(c => c.suit === suit && c.value === value);
    if (cardIndex === -1) {
        showModal('Fehler', 'Diese Karte haben Sie nicht auf der Hand!');
        return;
    }
    
    const card = currentPlayer.cards[cardIndex];
    
    // Regelvalidierung
    if (!canPlayCard(card, gameState.currentPlayer)) {
        showModal('Ungültiger Zug', 'Diese Karte können Sie jetzt nicht spielen.');
        return;
    }
    
    // Karte spielen
    currentPlayer.cards.splice(cardIndex, 1);
    addCardToTrick(card, gameState.currentPlayer);
    
    // Animation
    animateCardPlay(card, gameState.currentPlayer);
    
    // UI aktualisieren
    updateUI();
    
    // Nächste Aktion
    if (gameState.currentTrick.length === 4) {
        // Stich ist voll - auswerten
        setTimeout(evaluateTrick, 1000);
    } else {
        // Nächster Spieler
        nextPlayer();
        
        // CPU-Spieler automatisch spielen lassen
        if (!getCurrentPlayer().isHuman) {
            setTimeout(playCPUCard, 1500);
        }
    }
}

/**
 * Wertet den aktuellen Stich aus
 */
function evaluateTrick() {
    const trickResult = completeTrick();
    
    if (!trickResult) {
        console.error('Fehler beim Auswerten des Stichs');
        return;
    }
    
    // Stich-Gewinner anzeigen
    updateGameStatus(`${trickResult.winnerName} gewinnt den Stich (${trickResult.points} Punkte)`);
    
    // UI aktualisieren
    updateUI();
    
    // Prüfen ob Spiel beendet
    if (isGameFinished()) {
        setTimeout(endGame, 2000);
    } else {
        // Nächster Stich
        setTimeout(() => {
            updateUI();
            updateGameStatus();
            
            // Nächster Spieler (Stichgewinner) spielen lassen
            if (!getCurrentPlayer().isHuman) {
                setTimeout(playCPUCard, 1000);
            }
        }, 2000);
    }
}

/**
 * Lässt einen CPU-Spieler eine Karte spielen
 */
function playCPUCard() {
    const currentPlayer = getCurrentPlayer();
    
    if (currentPlayer.isHuman) {
        console.warn('CPU-Spielfunktion für menschlichen Spieler aufgerufen');
        return;
    }
    
    // Einfache KI: Spielbare Karte auswählen
    const playableCards = currentPlayer.cards.filter(card => 
        canPlayCard(card, gameState.currentPlayer)
    );
    
    if (playableCards.length === 0) {
        console.error('CPU hat keine spielbaren Karten');
        // Fallback: Erste Karte spielen
        if (currentPlayer.cards.length > 0) {
            playableCards.push(currentPlayer.cards[0]);
        } else {
            return;
        }
    }
    
    // KI-Entscheidung (vereinfacht)
    const selectedCard = selectCardWithAI(playableCards, gameState.currentPlayer);
    
    // Karte spielen
    const cardIndex = currentPlayer.cards.indexOf(selectedCard);
    currentPlayer.cards.splice(cardIndex, 1);
    addCardToTrick(selectedCard, gameState.currentPlayer);
    
    // Animation und UI-Update
    animateCardPlay(selectedCard, gameState.currentPlayer);
    updateUI();
    
    // Debug-Ausgabe
    if (gameState.debugMode) {
        console.log(`${currentPlayer.name} spielt: ${selectedCard.symbol}${selectedCard.short}`);
    }
    
    // Nächste Aktion
    if (gameState.currentTrick.length === 4) {
        setTimeout(evaluateTrick, 1000);
    } else {
        nextPlayer();
        if (!getCurrentPlayer().isHuman) {
            setTimeout(playCPUCard, 1500);
        }
    }
}

/**
 * Beendet das Spiel und zeigt Ergebnisse
 */
function endGame() {
    const result = finishGame();
    
    let message = `Spiel beendet!\n\n`;
    message += `Ihre Punkte: ${result.humanPoints}\n`;
    message += `CPU-Punkte: ${result.cpuPoints}\n\n`;
    
    if (result.humanWins) {
        message += `🎉 Glückwunsch! Sie haben gewonnen!`;
        if (result.humanPoints >= 91) {
            message += ` Mit Schneider!`;
        }
    } else {
        message += `😔 Sie haben verloren.`;
        if (result.humanPoints === 0) {
            message += ` Schwarz verloren!`;
        } else if (result.humanPoints < 31) {
            message += ` Mit Schneider verloren!`;
        }
    }
    
    message += `\n\nDetailscore:\n`;
    gameState.players.forEach(player => {
        message += `${player.name}: ${player.points} Punkte (${player.tricks} Stiche)\n`;
    });
    
    showModal('Spielende', message);
    updateGameStatus('Spiel beendet');
}

/**
 * Zeigt die Spielregeln an
 */
function showRules() {
    const rulesText = `Bayerisches Schafkopf - Spielregeln

ZIEL:
• 61 von 120 Punkten erreichen
• Bei 91+ Punkten: "Mit Schneider" gewonnen
• Bei 0 Punkten: "Schwarz" verloren

TRÜMPFE (von hoch zu niedrig):
• Eichel-Ober, Gras-Ober, Herz-Ober, Schellen-Ober
• Eichel-Unter, Gras-Unter, Herz-Unter, Schellen-Unter  
• Herz-Ass, Herz-Zehn, Herz-König, Herz-9, Herz-8, Herz-7

KARTENWERTE:
• Ass (Sau): 11 Punkte
• Zehn: 10 Punkte
• König: 4 Punkte
• Ober: 3 Punkte
• Unter: 2 Punkte
• 9, 8, 7: 0 Punkte

SPIELREGELN:
• Bedienungspflicht: Angespielte Farbe muss bedient werden
• Trumpfzwang: Bei Trumpf muss Trumpf zugegeben werden
• Stichzwang: Höhere Karte muss gespielt werden (wenn möglich)

AKTUELLE VERSION:
• Vereinfachtes Spiel ohne Partnerschaften
• Sie spielen gegen 3 CPU-Gegner
• Debug-Modus zeigt alle Karten offen

STEUERUNG:
• Karte anklicken zum Spielen
• F1: Diese Hilfe
• F2: Debug-Modus umschalten
• Strg+N: Neues Spiel`;

    showModal('Spielregeln', rulesText);
}

/**
 * Zeigt Spielstatistiken an
 */
function showStats() {
    const stats = getGameStats();
    
    let statsText = `Aktuelle Spielstatistik\n\n`;
    statsText += `Runde: ${stats.roundNumber}\n`;
    statsText += `Gespielte Stiche: ${stats.totalTricks}/8\n`;
    statsText += `Verbleibende Stiche: ${stats.tricksRemaining}\n\n`;
    
    statsText += `PUNKTESTAND:\n`;
    stats.players.forEach(player => {
        const marker = player.isHuman ? '👤' : '🤖';
        statsText += `${marker} ${player.name}: ${player.points} Punkte (${player.tricks} Stiche)\n`;
    });
    
    statsText += `\nGESAMTPUNKTE: ${stats.totalPoints}/120\n`;
    
    if (gameState.debugMode) {
        statsText += `\nDEBUG-INFO:\n`;
        statsText += `Spielphase: ${stats.gamePhase}\n`;
        statsText += `Aktuelle Stiche: ${gameState.currentTrick.length}\n`;
        statsText += `Abgeschlossene Stiche: ${gameState.completedTricks.length}\n`;
    }
    
    showModal('Spielstatistik', statsText);
}

/**
 * Schaltet den Debug-Modus um
 */
function toggleDebugMode() {
    const newMode = !gameState.debugMode;
    setDebugMode(newMode);
    updateUI();
    
    const message = newMode ? 
        'Debug-Modus aktiviert\n\nAlle Karten sind jetzt sichtbar.' :
        'Debug-Modus deaktiviert\n\nCPU-Karten sind wieder verdeckt.';
    
    showToast(message, 2000);
}

/**
 * Prüft ob eine Karte gespielt werden kann (Regelvalidierung)
 * @param {Object} card - Die zu prüfende Karte
 * @param {number} playerIndex - Index des Spielers
 * @returns {boolean} true wenn die Karte gespielt werden kann
 */
function canPlayCard(card, playerIndex) {
    // Erster Spieler im Stich kann alles spielen
    if (gameState.currentTrick.length === 0) {
        return true;
    }
    
    const leadCard = gameState.currentTrick[0].card;
    const playerCards = gameState.players[playerIndex].cards;
    
    // Trumpf wurde angespielt
    if (leadCard.isTrump) {
        // Wenn Spieler Trumpf hat, muss Trumpf gespielt werden
        if (card.isTrump) {
            return true;
        }
        // Wenn Spieler keinen Trumpf hat, kann beliebige Karte gespielt werden
        return !playerCards.some(c => c.isTrump);
    } 
    // Farbe wurde angespielt
    else {
        // Gleiche Farbe muss bedient werden (wenn vorhanden)
        if (card.suit === leadCard.suit && !card.isTrump) {
            return true;
        }
        // Wenn Spieler die Farbe nicht hat, kann beliebige Karte gespielt werden
        return !playerCards.some(c => c.suit === leadCard.suit && !c.isTrump);
    }
}

/**
 * Einfache KI-Funktion zur Kartenauswahl
 * @param {Array} playableCards - Array spielbarer Karten
 * @param {number} playerIndex - Index des CPU-Spielers
 * @returns {Object} Ausgewählte Karte
 */
function selectCardWithAI(playableCards, playerIndex) {
    // Sehr einfache KI - kann später erweitert werden
    
    // Wenn nur eine Karte spielbar ist
    if (playableCards.length === 1) {
        return playableCards[0];
    }
    
    // Strategie basierend auf Stichposition
    if (gameState.currentTrick.length === 0) {
        // Erster Spieler: Niedrige Karte ausspielen
        return playableCards.reduce((lowest, card) => 
            card.points < lowest.points ? card : lowest
        );
    } else {
        // Folgender Spieler: Versuche zu stechen oder niedrige Karte abwerfen
        const leadCard = gameState.currentTrick[0].card;
        const canWin = playableCards.filter(card => isCardHigher(card, leadCard));
        
        if (canWin.length > 0) {
            // Niedrigste Karte die sticht
            return canWin.reduce((lowest, card) => 
                card.trumpOrder < lowest.trumpOrder || card.order < lowest.order ? card : lowest
            );
        } else {
            // Niedrigste Karte abwerfen
            return playableCards.reduce((lowest, card) => 
                card.points < lowest.points ? card : lowest
            );
        }
    }
}

/**
 * Behandelt Fenstergröße-Änderungen
 */
function handleResize() {
    // UI an neue Fenstergröße anpassen
    updateUI();
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
        if (gameState.debugMode) {
            showToast('Debug-Modus ist aktiv - alle Karten sind sichtbar', 3000);
        }
    }, 1000);
}

/**
 * Exportiert Spielzustand für Debugging/Speichern
 */
function exportGameData() {
    return {
        gameState: getGameState(),
        gameLog: exportGameLog(),
        timestamp: new Date().toISOString(),
        version: '0.2.0'
    };
}

/**
 * Importiert Spielzustand (für Debugging/Laden)
 * @param {Object} data - Exportierte Spieldaten
 */
function importGameData(data) {
    try {
        if (data.gameState) {
            gameState = data.gameState;
            updateUI();
            console.log('Spielzustand erfolgreich importiert');
        }
    } catch (error) {
        console.error('Fehler beim Importieren:', error);
        showModal('Fehler', 'Spielzustand konnte nicht geladen werden.');
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
    window.closeModal = closeModal;
    window.handleCardClick = handleCardClick;
    window.debugUI = debugUI;
    window.exportGameData = exportGameData;
    window.importGameData = importGameData;
}