/**
 * Bayerisches Schafkopf - Haupteinstiegspunkt (Refactored)
 * Orchestriert alle Module und stellt eine einheitliche API bereit
 */

// Core-Module importieren
import { initializeGameState, getGameStateInternal, startNewRound, setGamePhase, finishGame } from './core/game-state.js';
import { GAME_PHASES, GAME_TYPES } from './core/constants.js';
import { logGameAction } from './core/utils.js';

// Cards-Module importieren
import { createDeck, setTrumpStatus } from './cards/cards.js';
import { shuffleDeck, dealCards } from './cards/deck.js';
import { sortCardsForDisplay } from './cards/card-utils.js';

/**
 * Startet ein neues Spiel
 */
function newGame() {
    logGameAction('Neues Spiel gestartet');
    
    // Continue-Button verstecken falls noch sichtbar
    hideContinueButton();
    
    // Spielzustand initialisieren (behält Debug-Modus)
    const currentDebugMode = window.gameState?.debugMode || true;
    initializeGameState({
        debugMode: currentDebugMode
    });
    
    // Deck erstellen und mischen
    const deck = createDeck();
    setTrumpStatus(deck);
    const shuffledDeck = shuffleDeck(deck);
    
    // Karten an Spieler verteilen
    const hands = dealCards(shuffledDeck);
    const gameState = getGameStateInternal();
    hands.forEach((hand, index) => {
        gameState.players[index].cards = hand;
    });
    
    // Spielphase auf Ass-Auswahl setzen
    setGamePhase(GAME_PHASES.BIDDING);
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
    }
}

/**
 * Zeigt die Ass-Auswahl für das Rufspiel
 */
function showAceSelection() {
    const gameState = getGameStateInternal();
    const humanPlayer = gameState.players[0];
    const availableAces = getAvailableAcesForCall(humanPlayer.cards);
    
    if (availableAces.length === 0) {
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
 * Zeigt die Ass-Auswahl Buttons unter den Spielerkarten
 * @param {Array} availableAces - Verfügbare Asse
 */
function showAceSelectionButtons(availableAces) {
    const cardsContainer = document.getElementById('cards-0');
    
    // Prüfen ob bereits Auswahl-Buttons existieren
    let selectionContainer = document.getElementById('ace-selection-container');
    if (!selectionContainer) {
        selectionContainer = document.createElement('div');
        selectionContainer.id = 'ace-selection-container';
        selectionContainer.className = 'ace-selection-container';
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
    
    updateGameStatus('Wählen Sie ein Ass für das Rufspiel...');
}

/**
 * Entfernt die Ass-Auswahl Buttons
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
        
        if (hasAce) return; // Eigenes Ass kann nicht gerufen werden
        
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
 * Behandelt die Auswahl eines Asses
 * @param {string} suit - Gewählte Farbe des Asses
 */
function selectAceForCall(suit) {
    const gameState = getGameStateInternal();
    
    // Gerufenes Ass im Spielzustand speichern
    gameState.calledAce = suit;
    gameState.gameType = GAME_TYPES.RUFSPIEL.id;
    gameState.calledSuitPlayed = false;
    
    // Partner finden (wer das gerufene Ass hat)
    findPartnerWithAce(suit);
    
    // Ass-Auswahl Buttons entfernen
    hideAceSelectionButtons();
    
    // Spiel starten
    startGameAfterAceSelection();
    
    logGameAction('Ass gerufen', { 
        suit: suit, 
        partner: gameState.calledAcePlayer 
    });
    
    if (gameState.debugMode) {
        const suitNames = {
            'eichel': 'Eichel',
            'gras': 'Gras',
            'schellen': 'Schellen',
            'herz': 'Herz'
        };
        console.log(`🎯 ${suitNames[suit]}-Ass gerufen - Partner ist ${gameState.players[gameState.calledAcePlayer].name}`);
        console.log(`⚠️  Ruffarbe darf erst nach dem ersten Ausspielen abgeworfen werden!`);
    }
}

/**
 * Bricht die Ass-Auswahl ab
 */
function cancelAceSelection() {
    hideAceSelectionButtons();
    updateGameStatus('Spiel abgebrochen - neues Spiel wird gestartet...');
    setTimeout(() => {
        newGame();
    }, 1000);
}

/**
 * Findet den Partner anhand des gerufenen Asses
 * @param {string} suit - Farbe des gerufenen Asses
 */
function findPartnerWithAce(suit) {
    const gameState = getGameStateInternal();
    
    for (let i = 1; i < gameState.players.length; i++) {
        const hasAce = gameState.players[i].cards.some(card => 
            card.suit === suit && card.value === 'sau'
        );
        
        if (hasAce) {
            gameState.calledAcePlayer = i;
            
            // Partnerschaft setzen: Sie (0) und Partner (i) = Team 0, alle anderen = Team 1
            gameState.playerPartnership[0] = 0; // Sie: Team 0
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
 * Startet das Spiel nach der Ass-Auswahl
 */
function startGameAfterAceSelection() {
    const gameState = getGameStateInternal();
    
    setGamePhase(GAME_PHASES.PLAYING);
    gameState.currentPlayer = 0; // Menschlicher Spieler beginnt
    
    updateUI();
    updateGameStatus('Rufspiel gestartet - Sie beginnen!');
    
    if (gameState.debugMode && gameState.calledAcePlayer >= 0) {
        const partnerName = gameState.players[gameState.calledAcePlayer].name;
        showToast(`Ihr Partner: ${partnerName}`, 3000);
        
        console.log('=== TRUMPF-STRATEGIE ===');
        console.log('Als spielende Partei sollten Sie:');
        console.log('1. Trümpfe ausspielen um Kontrolle zu übernehmen');
        console.log('2. Abwechselnd hohe und niedrige Trümpfe spielen');
        console.log('3. Partner wird entsprechend mitspielen');
        console.log('========================');
    }
}

/**
 * Behandelt den Fall, dass kein Ass gerufen werden kann
 */
function handleNoAceCallable() {
    showModal('Neues Spiel', 'Es wird ein neues Spiel gestartet.', () => {
        newGame();
    });
}

/**
 * Zeigt den "Weiter"-Button nach einem abgeschlossenen Stich
 */
function showContinueButton() {
    let continueContainer = document.getElementById('continue-container');
    if (!continueContainer) {
        continueContainer = document.createElement('div');
        continueContainer.id = 'continue-container';
        continueContainer.className = 'continue-container';
        
        const centerArea = document.querySelector('.center-area');
        if (centerArea) {
            centerArea.appendChild(continueContainer);
        }
    }
    
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
    hideContinueButton();
    
    if (isGameFinished()) {
        endGame();
    } else {
        updateUI();
        updateGameStatus();
        
        // Nächster Spieler kann spielen
        if (!getCurrentPlayer().isHuman) {
            setTimeout(playCPUCard, 1000);
        }
    }
}

/**
 * Spielt eine Karte
 * @param {string} suit - Farbe der Karte
 * @param {string} value - Wert der Karte
 */
function playCard(suit, value) {
    const gameState = getGameStateInternal();
    const currentPlayer = getCurrentPlayer();
    
    // Validierung: Ist der Spieler am Zug?
    if (!currentPlayer.isHuman && gameState.currentPlayer === 0) {
        showModal('Fehler', 'Sie sind nicht am Zug!');
        return;
    }
    
    // Prüfen ob Stich bereits voll ist
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
    
    // Regelvalidierung
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
        setTimeout(evaluateTrick, 1000);
    } else {
        nextPlayer();
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
    
    updateGameStatus(`${trickResult.winnerName} gewinnt den Stich (${trickResult.points} Punkte)`);
    updateUI();
    showContinueButton();
}

/**
 * Lässt einen CPU-Spieler eine Karte spielen
 */
function playCPUCard() {
    const gameState = getGameStateInternal();
    const currentPlayer = getCurrentPlayer();
    
    if (currentPlayer.isHuman) {
        console.warn('CPU-Spielfunktion für menschlichen Spieler aufgerufen');
        return;
    }
    
    if (gameState.currentTrick.length >= 4) {
        console.warn('CPU versucht zu spielen, aber Stich ist bereits voll');
        return;
    }
    
    // Spielbare Karten ermitteln
    const playableCards = currentPlayer.cards.filter(card => 
        canPlayCard(card, gameState.currentPlayer)
    );
    
    if (playableCards.length === 0) {
        console.error('CPU hat keine spielbaren Karten');
        if (currentPlayer.cards.length > 0) {
            playableCards.push(currentPlayer.cards[0]);
        } else {
            return;
        }
    }
    
    // KI-Entscheidung
    const selectedCard = selectCardWithAI(playableCards, gameState.currentPlayer);
    
    // Karte spielen
    const cardIndex = currentPlayer.cards.indexOf(selectedCard);
    currentPlayer.cards.splice(cardIndex, 1);
    addCardToTrick(selectedCard, gameState.currentPlayer);
    
    animateCardPlay(selectedCard, gameState.currentPlayer);
    updateUI();
    
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
    
    // Team-basierte Auswertung für Rufspiel
    if (result.isTeamGame && result.partner) {
        message += `🎯 Rufspiel-Ergebnis:\n`;
        message += `Ihr Team (mit ${result.partner}): ${result.teamPoints[0]} Punkte\n`;
        message += `Gegner-Team: ${result.teamPoints[1]} Punkte\n\n`;
        
        const teamWins = result.teamPoints[0] >= 61;
        
        if (teamWins) {
            message += `🎉 Ihr Team hat gewonnen!`;
            if (result.teamPoints[0] >= 91) {
                message += ` Mit Schneider! (91+ Punkte)`;
            }
        } else {
            message += `😔 Ihr Team hat verloren.`;
            if (result.teamPoints[0] <= 30) {
                message += ` Mit Schneider verloren! (≤30 Punkte)`;
            }
        }
        
        message += `\n\n📊 Einzelergebnisse:\n`;
        const gameState = getGameStateInternal();
        gameState.players.forEach((player, index) => {
            const teamIcon = gameState.playerPartnership[index] === 0 ? '👥' : '🔥';
            const teamName = gameState.playerPartnership[index] === 0 ? ' (Ihr Team)' : ' (Gegner)';
            message += `${teamIcon} ${player.name}${teamName}: ${player.points} Punkte (${player.tricks} Stiche)\n`;
        });
    } else {
        // Fallback für andere Spieltypen
        message += `Ihre Punkte: ${result.humanPoints}\n`;
        message += `Resultat: ${result.humanWins ? '🎉 Gewonnen!' : '😔 Verloren'}\n`;
    }
    
    showModal('Spielende', message);
    updateGameStatus('Spiel beendet');
}

// Legacy-Funktionen für Kompatibilität mit bestehendem Code
if (typeof window !== 'undefined') {
    // Spiel-Steuerung
    window.newGame = newGame;
    window.playCard = playCard;
    window.playCPUCard = playCPUCard;
    window.endGame = endGame;
    
    // Ass-Auswahl
    window.selectAceForCall = selectAceForCall;
    window.cancelAceSelection = cancelAceSelection;
    window.continueAfterTrick = continueAfterTrick;
    
    // UI-Funktionen (diese müssen noch aus ui.js importiert werden)
    window.showRules = showRules;
    window.showStats = showStats;
    window.toggleDebugMode = toggleDebugMode;
    window.toggleCardImages = toggleCardImages;
    window.closeModal = closeModal;
    window.handleCardClick = handleCardClick;
    window.handleImageError = handleImageError;
    window.debugUI = debugUI;
    
    // Export/Import
    window.exportGameData = exportGameData;
    window.importGameData = importGameData;
    
    // Hilfsfunktionen aus anderen Modulen (werden bei Bedarf nachgeladen)
    window.canPlayCard = canPlayCard;
    window.validateCardPlay = validateCardPlay;
    window.selectCardWithAI = selectCardWithAI;
    window.determineTrickWinner = determineTrickWinner;
    window.isGameFinished = isGameFinished;
    window.getCurrentPlayer = getCurrentPlayer;
    window.nextPlayer = nextPlayer;
    window.addCardToTrick = addCardToTrick;
    window.completeTrick = completeTrick;
    window.areTeammates = areTeammates;
    window.hasCalledSuitBeenPlayed = hasCalledSuitBeenPlayed;
    window.markCalledSuitPlayed = markCalledSuitPlayed;
    window.updateUI = updateUI;
    window.updateGameStatus = updateGameStatus;
    window.showModal = showModal;
    window.showToast = showToast;
    window.animateCardPlay = animateCardPlay;
    window.debugCards = debugCards;
    window.debugTrumpOrder = debugTrumpOrder;
    window.exportGameData = exportGameData;
    window.importGameData = importGameData;
}

/**
 * Initialisiert das Spiel beim Laden der Seite
 */
function initializeGame() {
    console.log('🃏 Bayerisches Schafkopf wird geladen...');
    
    // Event-Listener für Fenstergröße
    window.addEventListener('resize', () => updateUI());
    
    // Erstes Spiel starten
    newGame();
    
    console.log('✅ Spiel erfolgreich geladen!');
    
    // Willkommensnachricht
    setTimeout(() => {
        if (window.gameState?.debugMode) {
            showToast('Debug-Modus ist aktiv - alle Karten sind sichtbar', 3000);
        }
    }, 1000);
}

// Spiel beim Laden der Seite initialisieren
if (typeof window !== 'undefined') {
    window.addEventListener('load', initializeGame);
    window.initializeGame = initializeGame;
}
