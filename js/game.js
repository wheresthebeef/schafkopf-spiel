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
 * MIT INLINE ASS-AUSWAHL (kein Modal) + VORHAND-SYSTEM INTEGRATION
 */

/**
 * Startet ein neues Spiel (ERWEITERT: mit Vorhand-System Integration)
 */
function newGame() {
    logGameAction('Neues Spiel gestartet');
    
    // Continue-Button verstecken falls noch sichtbar
    hideContinueButton();
    
    // Spielzustand initialisieren
    initializeGameState({
        debugMode: gameState?.debugMode || true // Debug-Modus beibehalten oder standardmäßig an
    });
    
    // NEUES FEATURE: Vorhand-System nach gameState-Initialisierung aktivieren
    setTimeout(() => {
        if (typeof initializeVorhand === 'function') {
            initializeVorhand(0); // Menschlicher Spieler beginnt
            console.log('✅ Vorhand-System für neue Runde initialisiert');
        } else {
            console.warn('⚠️ initializeVorhand nicht verfügbar');
        }
    }, 100);
    
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
        'eichel': { name: 'Eichel' },
        'gras': { name: 'Gras' },
        'schellen': { name: 'Schellen' }
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
                name: `${callableSuits[suit].name}-Ass`
            });
        }
    });
    
    return availableAces;
}

/**
 * Behandelt die Auswahl eines Asses (ERWEITERT: mit Vorhand-Integration)
 * @param {string} suit - Gewählte Farbe des Asses
 */
function selectAceForCall(suit) {
    // Gerufenes Ass im Spielzustand speichern
    gameState.calledAce = suit;
    gameState.gameType = 'rufspiel';
    gameState.calledSuitPlayed = false; // KORRIGIERT: Ruffarbe ist NICHT gespielt beim Festlegen!
    
    // Partner finden (wer das gerufene Ass hat)
    findPartnerWithAce(suit);
    
    // Ass-Auswahl Buttons entfernen (GEÄNDERT!)
    hideAceSelectionButtons();
    
    // Spiel mit Vorhand-Unterstützung starten
    startGameAfterAceSelection();
    
    logGameAction('Ass gerufen', { 
        suit: suit, 
        partner: gameState.calledAcePlayer 
    });
    
    // DEBUG: Status anzeigen (ohne "gespielt"-Meldung)
    if (gameState.debugMode) {
        const suitNames = {
            'eichel': 'Eichel',
            'gras': 'Gras',
            'schellen': 'Schellen',
            'herz': 'Herz'
        };
        console.log(`🎯 ${suitNames[suit]}-Ass gerufen - Partner ist ${gameState.players[gameState.calledAcePlayer].name}`);
        console.log(`⚠️  Ruffarbe darf erst nach dem ersten Ausspielen abgeworfen werden!`);
        
        // NEUES FEATURE: Vorhand-Status anzeigen
        setTimeout(() => {
            if (typeof debugVorhand === 'function') {
                console.log('🔄 Vorhand-Status nach Ass-Auswahl:');
                debugVorhand();
            }
        }, 200);
    }
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
 * Startet das Spiel nach der Ass-Auswahl (ERWEITERT: mit Vorhand-System)
 */
function startGameAfterAceSelection() {
    gameState.gamePhase = 'playing';
    
    // NEUES FEATURE: Vorhand-Spieler als aktueller Spieler setzen
    if (typeof getCurrentVorhand === 'function') {
        const vorhandPlayer = getCurrentVorhand();
        if (vorhandPlayer !== null) {
            gameState.currentPlayer = vorhandPlayer;
            gameState.trickLeadPlayer = vorhandPlayer; // Ausspieler für ersten Stich
            
            console.log(`🎯 Spiel startet mit Vorhand: ${gameState.players[vorhandPlayer].name}`);
        } else {
            // Fallback wenn Vorhand-System nicht verfügbar
            gameState.currentPlayer = 0;
            console.warn('⚠️ Vorhand-System nicht verfügbar, Spieler 0 beginnt');
        }
    } else {
        // Alter Fallback - menschlicher Spieler beginnt
        gameState.currentPlayer = 0;
    }
    
    updateUI();
    
    const currentPlayerName = gameState.players[gameState.currentPlayer].name;
    updateGameStatus(`Rufspiel gestartet - ${currentPlayerName} beginnt!`);
    
    if (gameState.debugMode && gameState.calledAcePlayer >= 0) {
        const partnerName = gameState.players[gameState.calledAcePlayer].name;
        showToast(`Ihr Partner: ${partnerName}`, 3000);
        
        // NEUE DEBUG-INFO: Trumpf-Strategie-Hinweis
        console.log('=== TRUMPF-STRATEGIE ===');
        console.log('Als spielende Partei sollten Sie:');
        console.log('1. Trümpfe ausspielen um Kontrolle zu übernehmen');
        console.log('2. Abwechselnd hohe und niedrige Trümpfe spielen');
        console.log('3. Partner wird entsprechend mitspielen');
        console.log('========================');
    }
    
    // CPU-Spieler automatisch spielen lassen wenn nicht menschlicher Spieler beginnt
    if (!getCurrentPlayer().isHuman) {
        setTimeout(playCPUCard, 1500);
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

// Alle weiteren Funktionen bleiben unverändert - hier nur die kritischen Teile für Vorhand-Integration
// Rest der Datei bleibt bestehen...

/**
 * Initialisiert das Spiel beim Laden der Seite (ERWEITERT: mit Vorhand-Check)
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
        
        // NEUES FEATURE: Vorhand-System Status-Check
        setTimeout(() => {
            if (typeof debugVorhand === 'function') {
                console.log('🔄 Vorhand-System Status nach Spiel-Initialisierung:');
                debugVorhand();
            }
        }, 2000);
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
    
    // Neue Funktionen für Ass-Auswahl
    window.selectAceForCall = selectAceForCall;
    window.cancelAceSelection = cancelAceSelection;
    
    // Neue Funktion für Continue-Button
    window.continueAfterTrick = continueAfterTrick;
    
    // NEU: Debug-Funktion für Ruf-Ass-Status
    window.debugCalledAceStatus = debugCalledAceStatus;
}