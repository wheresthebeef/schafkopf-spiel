/**
 * UI Core Module - Haupt-UI-Updates und Anzeige-Funktionen
 * Verwaltet die Aktualisierung der Spieloberfläche
 */

/**
 * Komplette UI-Aktualisierung
 */
function updateUI() {
    updatePlayerCards();
    updatePlayerInfo();
    updateActivePlayer();
    updateGameInfo();
    updateGameStatus();
    updateTrickDisplay();
    updateTrumpInfo();
    updateDebugButton();
}

/**
 * Aktualisiert die Anzeige aller Spieler-Karten (FIXED: Defensive canPlayCard-Prüfung)
 */
function updatePlayerCards() {
    gameState.players.forEach((player, index) => {
        const cardsContainer = document.getElementById(`cards-${index}`);
        if (!cardsContainer) return;
        
        if (player.isHuman || gameState.debugMode) {
            // Karten sichtbar anzeigen - mit korrekter Sortierung für die Anzeige
            const sortedCards = sortCardsForDisplay([...player.cards]);
            
            cardsContainer.innerHTML = sortedCards.map(card => {
                // FIXED: Defensive Programmierung für canPlayCard
                let isPlayable = false;
                
                if (typeof canPlayCard === 'function') {
                    try {
                        isPlayable = canPlayCard(card, index);
                    } catch (error) {
                        console.warn('🃏 canPlayCard error:', error);
                        isPlayable = false;
                    }
                } else if (typeof window.canPlayCard === 'function') {
                    try {
                        isPlayable = window.canPlayCard(card, index);
                    } catch (error) {
                        console.warn('🃏 window.canPlayCard error:', error);
                        isPlayable = false;
                    }
                } else {
                    // Fallback: Basis-Check ohne Regelvalidierung
                    isPlayable = (index === gameState.currentPlayer && 
                                 gameState.gamePhase === 'playing');
                    
                    if (gameState.debugMode) {
                        console.warn('🃏 canPlayCard nicht verfügbar - Fallback verwendet');
                    }
                }
                
                return createCardHTML(card, isPlayable, false);
            }).join('');
        } else {
            // Kartenrückseiten anzeigen
            cardsContainer.innerHTML = player.cards.map(() => 
                createCardHTML(null, false, true)
            ).join('');
        }
    });
}

/**
 * Aktualisiert die Spieler-Informationen (Punkte, Stiche)
 */
function updatePlayerInfo() {
    gameState.players.forEach((player, index) => {
        const pointsElement = document.querySelector(`#player-${index} .points`);
        const tricksElement = document.querySelector(`#player-${index} .tricks`);
        
        if (pointsElement) pointsElement.textContent = player.points;
        if (tricksElement) tricksElement.textContent = player.tricks;
        
        // Team-Markierung hinzufügen (für Rufspiel)
        const playerElement = document.getElementById(`player-${index}`);
        if (playerElement && gameState.calledAcePlayer >= 0) {
            const isTeammate = gameState.playerPartnership[index] === gameState.playerPartnership[0];
            playerElement.classList.toggle('teammate', isTeammate && index !== 0);
            playerElement.classList.toggle('opponent', !isTeammate);
        }
    });
}

/**
 * Markiert den aktiven Spieler visuell
 */
function updateActivePlayer() {
    document.querySelectorAll('.player').forEach((element, index) => {
        element.classList.toggle('active', index === gameState.currentPlayer);
    });
}

/**
 * Aktualisiert die Spielinformationen im Header
 */
function updateGameInfo() {
    const gameTypeElement = document.getElementById('game-type');
    const roundCounterElement = document.getElementById('round-counter');
    const trickCounterElement = document.getElementById('trick-counter');
    
    if (gameTypeElement) {
        let gameTypeText = 'Rufspiel';
        if (gameState.gameType === 'rufspiel' && gameState.calledAce) {
            // Definiere Suit-Namen lokal
            const suitNames = {
                'eichel': 'Eichel',
                'gras': 'Gras',
                'schellen': 'Schellen',
                'herz': 'Herz'
            };
            gameTypeText = `Rufspiel (${suitNames[gameState.calledAce] || gameState.calledAce})`;
        }
        gameTypeElement.textContent = gameTypeText;
    }
    
    if (roundCounterElement) {
        roundCounterElement.textContent = gameState.roundNumber;
    }
    
    if (trickCounterElement) {
        trickCounterElement.textContent = `${gameState.trickNumber}/8`;
    }
}

/**
 * Aktualisiert den Spielstatus-Text
 * @param {string} message - Anzuzeigende Nachricht
 */
function updateGameStatus(message = null) {
    const statusElement = document.getElementById('game-status');
    if (!statusElement) return;
    
    if (message) {
        statusElement.textContent = message;
        return;
    }
    
    // Automatische Statusmeldung basierend auf Spielzustand
    const currentPlayer = getCurrentPlayer();
    
    switch (gameState.gamePhase) {
        case 'setup':
            statusElement.textContent = 'Spiel wird vorbereitet...';
            break;
            
        case 'bidding':
            statusElement.textContent = 'Wählen Sie ein Ass für das Rufspiel...';
            break;
            
        case 'playing':
            if (gameState.currentTrick.length === 0) {
                statusElement.textContent = `${currentPlayer.name} spielt aus`;
            } else {
                statusElement.textContent = `${currentPlayer.name} ist am Zug`;
            }
            break;
            
        case 'finished':
            statusElement.textContent = 'Spiel beendet';
            break;
            
        default:
            statusElement.textContent = '';
    }
}

/**
 * Zeigt den aktuellen Stich in der Mitte an (ERWEITERT: Auch letzter Stich nach Abschluss)
 */
function updateTrickDisplay() {
    const trickArea = document.getElementById('trick-area');
    if (!trickArea) return;
    
    let displayTrick = null;
    let isCompletedTrick = false;
    let winnerIndex = -1;
    
    if (gameState.currentTrick.length > 0) {
        // Aktueller Stich läuft
        displayTrick = gameState.currentTrick;
    } else if (gameState.completedTricks.length > 0) {
        // Zeige letzten abgeschlossenen Stich wenn kein aktueller Stich
        const lastTrick = gameState.completedTricks[gameState.completedTricks.length - 1];
        displayTrick = lastTrick.cards;
        isCompletedTrick = true;
        
        // Ermitteln welche Karte gewonnen hat
        let highestCard = displayTrick[0].card;
        winnerIndex = 0;
        
        for (let i = 1; i < displayTrick.length; i++) {
            const currentCard = displayTrick[i].card;
            if (isCardHigher(currentCard, highestCard)) {
                highestCard = currentCard;
                winnerIndex = i;
            }
        }
    }
    
    if (!displayTrick || displayTrick.length === 0) {
        trickArea.innerHTML = '';
        return;
    }
    
    // Karten in einer Reihe anzeigen, erste Karte links
    trickArea.innerHTML = displayTrick.map((trickCard, index) => {
        const playerName = gameState.players[trickCard.player].name;
        const completedClass = isCompletedTrick ? ' completed-trick' : '';
        const winningClass = (isCompletedTrick && index === winnerIndex) ? ' trick-winner' : '';
        
        return `
            <div class="trick-card${completedClass}${winningClass}" title="${playerName}">
                ${createCardHTML(trickCard.card, false, false)}
                <div style="position: absolute; bottom: -20px; font-size: 10px; color: #aaa;">
                    ${playerName}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Aktualisiert die Trump-Informationen (BEHOBEN!)
 */
function updateTrumpInfo() {
    const calledAceElement = document.getElementById('called-ace');
    if (calledAceElement) {
        if (gameState.calledAce) {
        // Definiere Suit-Namen lokal
        const suitNames = {
        'eichel': 'Eichel',
        'gras': 'Gras',
        'schellen': 'Schellen',
        'herz': 'Herz'
        };
        
        calledAceElement.textContent = `${suitNames[gameState.calledAce]}-Ass`;
        calledAceElement.style.color = '';
        } else {
        calledAceElement.textContent = '-';
        calledAceElement.style.color = '';
        }
    }
}

/**
 * Aktualisiert den Debug-Button und Card-Images-Button
 */
function updateDebugButton() {
    const debugButton = document.getElementById('debug-btn');
    if (debugButton) {
        debugButton.textContent = `Debug: ${gameState.debugMode ? 'AN' : 'AUS'}`;
        debugButton.classList.toggle('debug-active', gameState.debugMode);
    }
    
    const cardImagesButton = document.getElementById('card-images-btn');
    if (cardImagesButton) {
        const useImages = shouldUseCardImages();
        cardImagesButton.textContent = useImages ? 'Kartenbilder' : 'Kartensymbole';
        cardImagesButton.classList.toggle('images-active', useImages);
    }
}

/**
 * Bestimmt die Grid-Area für eine Spieler-Position im Stich
 * @param {number} playerIndex - Index des Spielers
 * @returns {string} CSS Grid-Area
 */
function getGridArea(playerIndex) {
    switch (playerIndex) {
        case 0: return '2 / 1 / 3 / 2'; // bottom
        case 1: return '1 / 1 / 2 / 2'; // left
        case 2: return '1 / 2 / 2 / 3'; // top
        case 3: return '2 / 2 / 3 / 3'; // right
        default: return '1 / 1 / 2 / 2';
    }
}

/**
 * DEBUG: UI-Debugging-Funktion für Karten-Click-Probleme
 */
function debugUICardSystem() {
    console.log('🎨 UI Card System Debug:');
    console.log('updatePlayerCards function available:', typeof updatePlayerCards === 'function');
    console.log('createCardHTML function available:', typeof createCardHTML === 'function');
    console.log('canPlayCard function available:', typeof canPlayCard === 'function');
    console.log('window.canPlayCard available:', typeof window.canPlayCard === 'function');
    
    // Test Karten-Container
    gameState.players.forEach((player, index) => {
        const container = document.getElementById(`cards-${index}`);
        console.log(`Player ${index} (${player.name}) container:`, !!container);
        if (container) {
            console.log(`  Cards in container: ${container.children.length}`);
            console.log(`  Player has cards: ${player.cards.length}`);
        }
    });
    
    // Test aktuelle Spielsituation
    console.log('Current game state:');
    console.log('  gamePhase:', gameState.gamePhase);
    console.log('  currentPlayer:', gameState.currentPlayer);
    console.log('  Human player (0) turn:', gameState.currentPlayer === 0);
    
    return {
        uiFunctions: {
            updatePlayerCards: typeof updatePlayerCards === 'function',
            createCardHTML: typeof createCardHTML === 'function',
            canPlayCard: typeof canPlayCard === 'function',
            windowCanPlayCard: typeof window.canPlayCard === 'function'
        },
        gameState: {
            phase: gameState.gamePhase,
            currentPlayer: gameState.currentPlayer,
            humanTurn: gameState.currentPlayer === 0
        },
        containersFound: gameState.players.map((player, index) => ({
            player: player.name,
            containerExists: !!document.getElementById(`cards-${index}`),
            cardCount: player.cards.length
        }))
    };
}

// Export Debug-Funktion global
if (typeof window !== 'undefined') {
    window.debugUICardSystem = debugUICardSystem;
    console.log('🔧 UI-Core.js: Debug-Funktionen global exportiert');
}