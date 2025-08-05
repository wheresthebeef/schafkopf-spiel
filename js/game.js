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
 * MIT INLINE ASS-AUSWAHL (kein Modal)
 */

/**
 * Startet ein neues Spiel
 */
function newGame() {
    logGameAction('Neues Spiel gestartet');
    
    // Continue-Button verstecken falls noch sichtbar
    hideContinueButton();
    
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
    
    // Spielphase auf Ass-Auswahl setzen (nicht direkt spielen)
    gameState.gamePhase = 'bidding';
    gameState.currentPlayer = 0; // Menschlicher Spieler wählt Ass
    
    // UI aktualisieren
    updateUI();
    updateGameStatus('Wählen Sie ein Ass für das Rufspiel...');
    
    // Ass-Auswahl anzeigen (INLINE, kein Modal!)
    showAceSelection();
    
    // Debug-Ausgabe
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
    }
}

/**
 * Zeigt die Ass-Auswahl für das Rufspiel (INLINE)
 */
function showAceSelection() {
    const humanPlayer = gameState.players[0];
    const availableAces = getAvailableAcesForCall(humanPlayer.cards);
    
    if (availableAces.length === 0) {
        // Kein Ass rufbar - automatisch Solo vorschlagen oder pass
        showModal('Kein Ass rufbar', 
            'Sie können kein Ass rufen. Das Spiel wird als Ramsch gespielt oder Sie können ein Solo ansagen.',
            () => handleNoAceCallable()
        );
        return;
    }
    
    // Ass-Auswahl-Buttons unter den Spielerkarten anzeigen
    showAceSelectionButtons(availableAces);
}

/**
 * Zeigt die Ass-Auswahl Buttons unter den Spielerkarten (NEUE FUNKTION)
 * @param {Array} availableAces - Verfügbare Asse
 */
function showAceSelectionButtons(availableAces) {
    const humanPlayerElement = document.getElementById('player-0');
    const cardsContainer = document.getElementById('cards-0');
    
    // Prüfen ob bereits Auswahl-Buttons existieren
    let selectionContainer = document.getElementById('ace-selection-container');
    if (!selectionContainer) {
        // Container für Ass-Auswahl erstellen
        selectionContainer = document.createElement('div');
        selectionContainer.id = 'ace-selection-container';
        selectionContainer.className = 'ace-selection-container';
        
        // Nach dem Karten-Container einfügen
        cardsContainer.parentNode.insertBefore(selectionContainer, cardsContainer.nextSibling);
    }
    
    // Ass-Auswahl HTML erstellen
    selectionContainer.innerHTML = `
        <div class="ace-selection-prompt">
            <strong>🃏 Rufspiel: Wählen Sie ein Ass</strong>
            <div class="ace-selection-help">Herz ist Trumpf - Sie können nur Asse rufen, wenn Sie die passende Farbe haben</div>
        </div>
        <div class="ace-selection-buttons-inline">
            ${availableAces.map(ace => `
                <button class="btn ace-btn-inline" onclick="selectAceForCall('${ace.suit}')">
                    <span class="ace-symbol">${ace.symbol}</span>
                    <span class="ace-name">${ace.name}</span>
                </button>
            `).join('')}
            <button class="btn cancel-btn-inline" onclick="cancelAceSelection()">
                Abbrechen
            </button>
        </div>
    `;
    
    // Status aktualisieren
    updateGameStatus('Wählen Sie ein Ass für das Rufspiel...');
}

/**
 * Entfernt die Ass-Auswahl Buttons (NEUE FUNKTION)
 */
function hideAceSelectionButtons() {
    const selectionContainer = document.getElementById('ace-selection-container');
    if (selectionContainer) {
        selectionContainer.remove();
    }
}

/**
 * Ermittelt welche Asse der Spieler rufen kann
 * @param {Array} playerCards - Karten des Spielers
 * @returns {Array} Array mit rufbaren Assen
 */
function getAvailableAcesForCall(playerCards) {
    const availableAces = [];
    
    // Definiere die rufbaren Farben (Herz ist Trumpf, daher nicht rufbar)
    const callableSuits = {
        'eichel': { name: 'Eichel', symbol: '🌰' },
        'gras': { name: 'Gras', symbol: '🍀' },
        'schellen': { name: 'Schellen', symbol: '🔔' }
    };
    
    Object.keys(callableSuits).forEach(suit => {
        // Prüfen ob Spieler selbst das Ass hat
        const hasAce = playerCards.some(card => 
            card.suit === suit && card.value === 'sau'
        );
        
        if (hasAce) {
            return; // Eigenes Ass kann nicht gerufen werden
        }
        
        // Prüfen ob Spieler mindestens eine Karte der Farbe hat (außer Ober/Unter)
        const hasSuitCard = playerCards.some(card => 
            card.suit === suit && 
            card.value !== 'ober' && 
            card.value !== 'unter'
        );
        
        if (hasSuitCard) {
            availableAces.push({
                suit: suit,
                name: `${callableSuits[suit].name}-Ass`,
                symbol: callableSuits[suit].symbol
            });
        }
    });
    
    return availableAces;
}

/**
 * Behandelt die Auswahl eines Asses (GEÄNDERT)
 * @param {string} suit - Gewählte Farbe des Asses
 */
function selectAceForCall(suit) {
    // Gerufenes Ass im Spielzustand speichern
    gameState.calledAce = suit;
    gameState.gameType = 'rufspiel';
    
    // Partner finden (wer das gerufene Ass hat)
    findPartnerWithAce(suit);
    
    // Ass-Auswahl Buttons entfernen (GEÄNDERT!)
    hideAceSelectionButtons();
    
    // Spiel starten
    startGameAfterAceSelection();
    
    logGameAction('Ass gerufen', { 
        suit: suit, 
        partner: gameState.calledAcePlayer 
    });
}

/**
 * Bricht die Ass-Auswahl ab (GEÄNDERT)
 */
function cancelAceSelection() {
    // Buttons entfernen (GEÄNDERT!)
    hideAceSelectionButtons();
    
    // Neues Spiel starten
    updateGameStatus('Spiel abgebrochen - neues Spiel wird gestartet...');
    setTimeout(() => {
        newGame();
    }, 1000);
}

/**
 * Findet den Partner anhand des gerufenen Asses
 * @param {string} suit - Farbe des gerufenen Asses
 */
/**
 * Findet den Partner anhand des gerufenen Asses (BEHOBEN!)
 * @param {string} suit - Farbe des gerufenen Asses
 */
function findPartnerWithAce(suit) {
    for (let i = 1; i < gameState.players.length; i++) {
        const hasAce = gameState.players[i].cards.some(card => 
            card.suit === suit && card.value === 'sau'
        );
        
        if (hasAce) {
            gameState.calledAcePlayer = i;
            
            // KORRIGIERTE Partnerschaft setzen:
            // Sie (0) und Partner (i) = Team 0, alle anderen = Team 1
            gameState.playerPartnership[0] = 0; // Sie: Team 0
            gameState.playerPartnership[1] = (i === 1) ? 0 : 1; // Anna: Team 0 wenn Partner, sonst Team 1
            gameState.playerPartnership[2] = (i === 2) ? 0 : 1; // Hans: Team 0 wenn Partner, sonst Team 1
            gameState.playerPartnership[3] = (i === 3) ? 0 : 1; // Sepp: Team 0 wenn Partner, sonst Team 1
            
            if (gameState.debugMode) {
                // Definiere Suit-Namen lokal (FIX!)
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
 * Startet das Spiel nach der Ass-Auswahl
 */
function startGameAfterAceSelection() {
    gameState.gamePhase = 'playing';
    gameState.currentPlayer = 0; // Menschlicher Spieler beginnt
    
    updateUI();
    updateGameStatus('Rufspiel gestartet - Sie beginnen!');
    
    if (gameState.debugMode && gameState.calledAcePlayer >= 0) {
        const partnerName = gameState.players[gameState.calledAcePlayer].name;
        showToast(`Ihr Partner: ${partnerName}`, 3000);
    }
}

/**
 * Behandelt den Fall, dass kein Ass gerufen werden kann
 */
function handleNoAceCallable() {
    // Vereinfacht: Neues Spiel starten
    showModal('Neues Spiel', 'Es wird ein neues Spiel gestartet.', () => {
        newGame();
    });
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
    
    // WICHTIG: Prüfen ob Stich bereits voll ist (Bugfix!)
    if (gameState.currentTrick.length >= 4) {
        console.warn('Versuch zu spielen, aber Stich ist bereits voll');
        return;
    }
    
    // Karte in der Hand finden
    const cardIndex = currentPlayer.cards.findIndex(c => c.suit === suit && c.value === value);
    if (cardIndex === -1) {
        showModal('Fehler', 'Diese Karte haben Sie nicht auf der Hand!');
        return;
    }
    
    const card = currentPlayer.cards[cardIndex];
    
    // Regelvalidierung mit spezifischer Fehlermeldung
    const validation = validateCardPlay(card, gameState.currentPlayer, gameState.currentTrick, currentPlayer.cards);
    if (!validation.valid) {
        showModal('Unerlaubter Zug', validation.reason);
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
    
    // NEUES VERHALTEN: Stich bleibt liegen, "Weiter"-Button anzeigen
    showContinueButton();
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
    
    // WICHTIG: Prüfen ob aktueller Stich schon voll ist (Bugfix!)
    if (gameState.currentTrick.length >= 4) {
        console.warn('CPU versucht zu spielen, aber Stich ist bereits voll');
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
 * Beendet das Spiel und zeigt Ergebnisse (ÜBERARBEITET: Team-basierte Auswertung)
 */
function endGame() {
    const result = finishGame();
    
    let message = `Spiel beendet!\n\n`;
    
    // Korrekte Team-basierte Auswertung für Rufspiel
    if (gameState.gameType === 'rufspiel' && gameState.calledAcePlayer >= 0) {
        const partnerName = gameState.players[gameState.calledAcePlayer].name;
        
        // Team-Punkte korrekt berechnen
        const team0Points = gameState.players
            .filter((p, i) => gameState.playerPartnership[i] === 0)
            .reduce((sum, p) => sum + p.points, 0);
        const team1Points = gameState.players
            .filter((p, i) => gameState.playerPartnership[i] === 1)
            .reduce((sum, p) => sum + p.points, 0);
        
        message += `🎯 Rufspiel-Ergebnis:\n`;
        message += `Ihr Team (mit ${partnerName}): ${team0Points} Punkte\n`;
        message += `Gegner-Team: ${team1Points} Punkte\n\n`;
        
        // Gewinner basierend auf Team-Punkten ermitteln
        const teamWins = team0Points >= 61;
        
        if (teamWins) {
            message += `🎉 Ihr Team hat gewonnen!`;
            if (team0Points >= 91) {
                message += ` Mit Schneider! (91+ Punkte)`;
            } else if (team0Points >= 61) {
                message += ` Knapp gewonnen!`;
            }
        } else {
            message += `😔 Ihr Team hat verloren.`;
            if (team0Points <= 30) {
                message += ` Mit Schneider verloren! (≤30 Punkte)`;
            } else if (team0Points === 0) {
                message += ` Schwarz verloren!`;
            } else {
                message += ` Knapp verloren.`;
            }
        }
        
        message += `\n\n📊 Einzelergebnisse:\n`;
        gameState.players.forEach((player, index) => {
            const teamIcon = gameState.playerPartnership[index] === 0 ? '👥' : '🔥';
            const teamName = gameState.playerPartnership[index] === 0 ? ' (Ihr Team)' : ' (Gegner)';
            message += `${teamIcon} ${player.name}${teamName}: ${player.points} Punkte (${player.tricks} Stiche)\n`;
        });
        
    } else {
        // Fallback für andere Spieltypen (Solo, etc.)
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
            } else if (result.humanPoints <= 30) {
                message += ` Mit Schneider verloren!`;
            }
        }
        
        message += `\n\nEinzelscores:\n`;
        gameState.players.forEach((player, index) => {
            message += `${player.name}: ${player.points} Punkte (${player.tricks} Stiche)\n`;
        });
    }
    
    showModal('Spielende', message);
    updateGameStatus('Spiel beendet');
}

/**
 * Zeigt die Spielregeln an
 */
function showRules() {
    const rulesText = `Bayerisches Schafkopf - Spielregeln

ZIEL:
• 61 von 120 Punkten erreichen (im Team bei Rufspiel)
• Bei 91+ Punkten: "Mit Schneider" gewonnen
• Bei 0 Punkten: "Schwarz" verloren

RUFSPIEL:
• Sie wählen ein Ass (außer Herz-Ass)
• Der Spieler mit diesem Ass wird Ihr Partner
• Ihr Team muss zusammen 61+ Punkte erreichen
• Sie können nur Asse rufen, wenn Sie mindestens eine Karte der gleichen Farbe haben (Ober/Unter zählen nicht)

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
• SAU-ZWANG: Wenn die Farbe des gerufenen Asses ausgespielt wird, muss der Partner das Ass spielen!
• Trumpfzwang: Bei Trumpf muss Trumpf zugegeben werden
• KEIN STICHZWANG: Sie können niedrige Karten spielen und ‘schmieren’ (hohe Karten in sichere Stiche)

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
    statsText += `Spieltyp: ${gameState.gameType === 'rufspiel' ? 'Rufspiel' : gameState.gameType}\n`;
    if (gameState.calledAce && gameState.calledAcePlayer >= 0) {
        const partnerName = gameState.players[gameState.calledAcePlayer].name;
        
        // Definiere Suit-Namen lokal für die Anzeige
        const suitNames = {
            'eichel': 'Eichel',
            'gras': 'Gras', 
            'schellen': 'Schellen',
            'herz': 'Herz'
        };
        
        statsText += `Gerufenes Ass: ${suitNames[gameState.calledAce] || gameState.calledAce}-Ass\n`;
        statsText += `Ihr Partner: ${partnerName}\n`;
    }
    statsText += `Runde: ${stats.roundNumber}\n`;
    statsText += `Gespielte Stiche: ${stats.totalTricks}/8\n`;
    statsText += `Verbleibende Stiche: ${stats.tricksRemaining}\n\n`;
    
    statsText += `PUNKTESTAND:\n`;
    stats.players.forEach((player, index) => {
        const marker = player.isHuman ? '👤' : '🤖';
        const teamMarker = gameState.calledAcePlayer >= 0 ? 
            (gameState.playerPartnership[index] === 0 ? ' 👥' : ' 🔥') : '';
        statsText += `${marker} ${player.name}${teamMarker}: ${player.points} Punkte (${player.tricks} Stiche)\n`;
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
 * Schaltet zwischen Kartenbildern und Symbolen um
 */
function toggleCardImages() {
    const currentMode = shouldUseCardImages();
    setCardImagesMode(!currentMode);
}

/**
 * Prüft ob eine Karte gespielt werden kann (Regelvalidierung mit Sau-Zwang)
 * @param {Object} card - Die zu prüfende Karte
 * @param {number} playerIndex - Index des Spielers
 * @returns {boolean} true wenn die Karte gespielt werden kann
 */
function canPlayCard(card, playerIndex) {
    // Während Ass-Auswahl können keine Karten gespielt werden
    if (gameState.gamePhase === 'bidding') {
        return false;
    }
    
    // Vollständige Regelvalidierung mit Sau-Zwang verwenden
    const playerCards = gameState.players[playerIndex].cards;
    const validation = validateCardPlay(card, playerIndex, gameState.currentTrick, playerCards);
    
    return validation.valid;
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
        version: '0.3.0'
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
    window.toggleCardImages = toggleCardImages;
    window.closeModal = closeModal;
    window.handleCardClick = handleCardClick;
    window.handleImageError = handleImageError;
    window.debugUI = debugUI;
    window.exportGameData = exportGameData;
    window.importGameData = importGameData;
    
    // Neue Funktionen für Ass-Auswahl
    window.selectAceForCall = selectAceForCall;
    window.cancelAceSelection = cancelAceSelection;
    
    // Neue Funktion für Continue-Button
    window.continueAfterTrick = continueAfterTrick;
}