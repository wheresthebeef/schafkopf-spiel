/**
 * Bayerisches Schafkopf - Benutzeroberfläche
 * Verwaltet das Rendering der Spieloberfläche und Benutzerinteraktionen
 */

/**
 * Erstellt HTML für eine Karte (ERWEITERT: Unterstützt Kartenbilder)
 * @param {Object} card - Kartenobjekt
 * @param {boolean} isPlayable - Ob die Karte spielbar ist
 * @param {boolean} showBack - Ob Kartenrückseite angezeigt werden soll
 * @returns {string} HTML-String für die Karte
 */
function createCardHTML(card, isPlayable = false, showBack = false) {
    if (showBack) {
        return createCardBackHTML();
    }
    
    const playableClass = isPlayable ? ' playable' : '';
    const colorClass = card.color === 'red' ? ' red' : (card.color === 'green' ? ' green' : '');
    const trumpClass = card.isTrump ? ' trump' : '';
    
    // Prüfen ob Kartenbilder verwendet werden sollen
    if (shouldUseCardImages()) {
        return createCardImageHTML(card, playableClass, colorClass, trumpClass, isPlayable);
    } else {
        return createCardSymbolHTML(card, playableClass, colorClass, trumpClass, isPlayable);
    }
}

/**
 * Erstellt HTML für Kartenrückseite
 * @returns {string} HTML für Kartenrückseite
 */
function createCardBackHTML() {
    if (shouldUseCardImages()) {
        const backImagePath = getCardImagePath('back', 'back');
        return `
            <div class="card card-back">
                <img src="${backImagePath}" alt="Kartenrückseite" class="card-image" 
                     onerror="this.style.display='none'; this.parentNode.innerHTML='🃏';">
            </div>
        `;
    } else {
        return `<div class="card card-back">🃏</div>`;
    }
}

/**
 * Erstellt HTML für Karte mit Bild
 * @param {Object} card - Kartenobjekt 
 * @param {string} playableClass - CSS-Klasse für spielbare Karten
 * @param {string} colorClass - CSS-Klasse für Kartenfarbe
 * @param {string} trumpClass - CSS-Klasse für Trumpfkarten
 * @param {boolean} isPlayable - Ob Karte spielbar ist
 * @returns {string} HTML mit Kartenbild
 */
function createCardImageHTML(card, playableClass, colorClass, trumpClass, isPlayable) {
    const imagePath = getCardImagePath(card.suit, card.value);
    const clickHandler = isPlayable ? `onclick="handleCardClick('${card.suit}', '${card.value}')"` : '';
    
    return `
        <div class="card card-image-container${colorClass}${playableClass}${trumpClass}" 
             data-suit="${card.suit}" 
             data-value="${card.value}"
             data-card-id="${card.id}"
             ${clickHandler}
             title="${card.name}">
            <img src="${imagePath}" alt="${card.name}" class="card-image"
                 onerror="handleImageError(this, '${card.suit}', '${card.value}')"
                 loading="lazy">
        </div>
    `;
}

/**
 * Erstellt HTML für Karte mit Symbolen (Original-Version)
 * @param {Object} card - Kartenobjekt
 * @param {string} playableClass - CSS-Klasse für spielbare Karten
 * @param {string} colorClass - CSS-Klasse für Kartenfarbe  
 * @param {string} trumpClass - CSS-Klasse für Trumpfkarten
 * @param {boolean} isPlayable - Ob Karte spielbar ist
 * @returns {string} HTML mit Kartensymbolen
 */
function createCardSymbolHTML(card, playableClass, colorClass, trumpClass, isPlayable) {
    const clickHandler = isPlayable ? `onclick="handleCardClick('${card.suit}', '${card.value}')"` : '';
    
    return `
        <div class="card${colorClass}${playableClass}${trumpClass}" 
             data-suit="${card.suit}" 
             data-value="${card.value}"
             data-card-id="${card.id}"
             ${clickHandler}
             title="${card.name}">
            <div class="suit-symbol">${card.symbol}</div>
            <div>${card.short}</div>
        </div>
    `;
}

/**
 * Fallback-HTML für Karten wenn Bild nicht geladen werden kann
 * @param {Object} card - Kartenobjekt
 * @returns {string} Fallback-HTML
 */
function createCardSymbolFallback(card) {
    return `
        <div class="suit-symbol">${card.symbol}</div>
        <div>${card.short}</div>
    `;
}

/**
 * Ermittelt den Pfad zu einem Kartenbild
 * @param {string} suit - Kartenfarbe
 * @param {string} value - Kartenwert  
 * @returns {string} Pfad zum Kartenbild
 */
function getCardImagePath(suit, value) {
    if (suit === 'back' && value === 'back') {
        return 'assets/cards/card_back.png';
    }
    return `assets/cards/${suit}_${value}.png`;
}

/**
 * Prüft ob Kartenbilder verwendet werden sollen
 * @returns {boolean} true wenn Kartenbilder verfügbar sind
 */
function shouldUseCardImages() {
    // Prüfen ob Kartenbilder-Modus aktiviert ist
    if (gameState && gameState.useCardImages !== undefined) {
        return gameState.useCardImages;
    }
    
    // Standard: Bilder verwenden wenn verfügbar
    return window.cardImagesAvailable !== false;
}

/**
 * Aktiviert/Deaktiviert Kartenbilder-Modus
 * @param {boolean} enabled - true für Kartenbilder, false für Symbole
 */
function setCardImagesMode(enabled) {
    if (gameState) {
        gameState.useCardImages = enabled;
    }
    window.cardImagesAvailable = enabled;
    
    // UI neu laden
    updateUI();
    
    const mode = enabled ? 'Kartenbilder' : 'Kartensymbole';
    showToast(`${mode} aktiviert`, 2000);
    
    logGameAction('Kartendarstellung geändert', { useImages: enabled });
}

/**
 * Aktualisiert die Anzeige aller Spieler-Karten
 */
function updatePlayerCards() {
    gameState.players.forEach((player, index) => {
        const cardsContainer = document.getElementById(`cards-${index}`);
        if (!cardsContainer) return;
        
        if (player.isHuman || gameState.debugMode) {
            // Karten sichtbar anzeigen - mit korrekter Sortierung für die Anzeige
            const sortedCards = sortCardsForDisplay([...player.cards]);
            cardsContainer.innerHTML = sortedCards.map(card => 
                createCardHTML(card, canPlayCard(card, index), false)
            ).join('');
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
 * Aktualisiert die Trump-Informationen (BEHOBEN!)
 */
function updateTrumpInfo() {
    const calledAceElement = document.getElementById('called-ace');
    if (calledAceElement) {
        if (gameState.calledAce) {
            // Definiere Suit-Informationen lokal (FIX!)
            const suitInfo = {
                'eichel': { symbol: '🌰', color: 'black' },
                'gras': { symbol: '🍀', color: 'green' },
                'schellen': { symbol: '🔔', color: 'red' },
                'herz': { symbol: '❤️', color: 'red' }
            };
            
            const aceSuit = suitInfo[gameState.calledAce];
            if (aceSuit) {
                calledAceElement.textContent = `${aceSuit.symbol}A`;
                calledAceElement.style.color = aceSuit.color === 'red' ? '#e53e3e' : (aceSuit.color === 'green' ? '#16a34a' : '#2d3748');
            } else {
                calledAceElement.textContent = `${gameState.calledAce}A`;
                calledAceElement.style.color = '';
            }
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
 * Zeigt ein Modal-Fenster an
 * @param {string} title - Titel des Modals
 * @param {string} text - Text des Modals
 * @param {Function} callback - Callback-Funktion beim Schließen
 */
function showModal(title, text, callback = null) {
    const modal = document.getElementById('modal');
    const titleElement = document.getElementById('modal-title');
    const textElement = document.getElementById('modal-text');
    
    if (titleElement) titleElement.textContent = title;
    if (textElement) {
        // Prüfen ob HTML-Content übergeben wurde
        if (text.includes('<')) {
            textElement.innerHTML = text;
        } else {
            textElement.textContent = text;
        }
    }
    
    if (modal) {
        modal.style.display = 'block';
        modal.dataset.callback = callback ? callback.toString() : '';
        // Präventives Schließen zurücksetzen
        modal.dataset.preventClose = '';
    }
}

/**
 * Schließt das Modal-Fenster
 */
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal && !modal.dataset.preventClose) {
        const callback = modal.dataset.callback;
        modal.style.display = 'none';
        
        // Callback ausführen falls vorhanden
        if (callback && callback !== 'null') {
            try {
                eval(callback)();
            } catch (e) {
                console.warn('Modal callback error:', e);
            }
        }
    }
}

/**
 * Behandelt Kartenklicks
 * @param {string} suit - Farbe der geklickten Karte
 * @param {string} value - Wert der geklickten Karte
 */
function handleCardClick(suit, value) {
    // Nur menschliche Spieler können Karten klicken
    if (!isPlayerTurn(0)) {
        showModal('Nicht am Zug', 'Sie sind gerade nicht am Zug!');
        return;
    }
    
    // Während Ass-Auswahl keine Karten spielbar
    if (gameState.gamePhase === 'bidding') {
        showModal('Ass-Auswahl', 'Bitte wählen Sie zuerst ein Ass für das Rufspiel.');
        return;
    }
    
    playCard(suit, value);
}

/**
 * Behandelt Fehler beim Laden von Kartenbildern
 * @param {HTMLImageElement} img - Das fehlgeschlagene Bild-Element
 * @param {string} suit - Kartenfarbe
 * @param {string} value - Kartenwert
 */
function handleImageError(img, suit, value) {
    // Bild verstecken
    img.style.display = 'none';
    
    // Karte aus gameState finden für Symbole
    const card = findCardInGameState(suit, value);
    if (card) {
        // Fallback-Content mit Symbolen einfügen
        const container = img.parentNode;
        container.classList.add('fallback');
        container.innerHTML = `
            <div class="suit-symbol">${card.symbol}</div>
            <div>${card.short}</div>
        `;
        
        // Click-Handler wiederherstellen falls nötig
        const isPlayable = container.classList.contains('playable');
        if (isPlayable) {
            container.onclick = () => handleCardClick(suit, value);
        }
    }
}

/**
 * Findet eine Karte im aktuellen Spielzustand
 * @param {string} suit - Kartenfarbe
 * @param {string} value - Kartenwert
 * @returns {Object|null} Karte oder null
 */
function findCardInGameState(suit, value) {
    // In allen Spielerkarten suchen
    for (const player of gameState.players) {
        const card = player.cards.find(c => c.suit === suit && c.value === value);
        if (card) return card;
    }
    
    // In aktuellen Stichen suchen
    for (const trickCard of gameState.currentTrick) {
        if (trickCard.card.suit === suit && trickCard.card.value === value) {
            return trickCard.card;
        }
    }
    
    // In abgeschlossenen Stichen suchen
    for (const completedTrick of gameState.completedTricks) {
        for (const trickCard of completedTrick.cards) {
            if (trickCard.card.suit === suit && trickCard.card.value === value) {
                return trickCard.card;
            }
        }
    }
    
    // Fallback: Karte aus Standarddeck erstellen
    const deck = createDeck();
    setTrumpStatus(deck);
    return deck.find(c => c.suit === suit && c.value === value) || null;
}

/**
 * Animiert das Ausspielen einer Karte (DEAKTIVIERT - keine Animation)
 * @param {Object} card - Die gespielte Karte
 * @param {number} playerIndex - Index des Spielers
 */
function animateCardPlay(card, playerIndex) {
    // Animation entfernt für besseres Spielgefühl
    // Keine Animation mehr
}

/**
 * Zeigt eine temporäre Nachricht an
 * @param {string} message - Anzuzeigende Nachricht
 * @param {number} duration - Anzeigedauer in Millisekunden
 */
function showToast(message, duration = 3000) {
    // Erstelle Toast-Element falls es nicht existiert
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 2000;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, duration);
}

/**
 * Führt eine sanfte Scroll-Animation zu einem Element durch
 * @param {string} elementId - ID des Ziel-Elements
 */
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

/**
 * Behandelt Tastatureingaben
 * @param {KeyboardEvent} event - Tastatur-Event
 */
function handleKeyboardInput(event) {
    switch (event.key) {
        case 'Escape':
            closeModal();
            break;
            
        case 'F1':
            event.preventDefault();
            showRules();
            break;
            
        case 'F2':
            event.preventDefault();
            toggleDebugMode();
            break;
            
        case 'n':
        case 'N':
            if (event.ctrlKey) {
                event.preventDefault();
                newGame();
            }
            break;
    }
}

/**
 * Initialisiert Event-Listener
 */
function initializeEventListeners() {
    // Keyboard-Handler
    document.addEventListener('keydown', handleKeyboardInput);
    
    // Modal schließen bei Klick außerhalb (nur wenn nicht preventClose)
    document.addEventListener('click', (event) => {
        const modal = document.getElementById('modal');
        if (event.target === modal && !modal.dataset.preventClose) {
            closeModal();
        }
    });
    
    // Verhindere Kontextmenü auf Karten (für bessere Mobile-Erfahrung)
    document.addEventListener('contextmenu', (event) => {
        if (event.target.classList.contains('card')) {
            event.preventDefault();
        }
    });
}

/**
 * Gibt Debug-Informationen in der Konsole aus
 */
function debugUI() {
    console.log('=== UI Debug Info ===');
    console.log('Game State:', getGameState());
    console.log('Current Player:', getCurrentPlayer());
    console.log('Current Trick:', gameState.currentTrick);
    console.log('Called Ace:', gameState.calledAce);
    console.log('Partner:', gameState.calledAcePlayer >= 0 ? gameState.players[gameState.calledAcePlayer].name : 'None');
    console.log('Partnerships:', gameState.playerPartnership);
    console.log('Game Log:', exportGameLog().slice(-5)); // Letzte 5 Einträge
}

// Event-Listener beim Laden initialisieren
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializeEventListeners);
}