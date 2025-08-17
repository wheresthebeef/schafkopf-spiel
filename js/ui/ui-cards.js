/**
 * UI Cards Module - Karten-spezifische UI-Funktionen
 * Verwaltet das Rendering und die Interaktion mit Spielkarten
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
    const clickHandler = isPlayable ? `onclick=\"handleCardClick('${card.suit}', '${card.value}')\"` : '';
    
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
    const clickHandler = isPlayable ? `onclick=\"handleCardClick('${card.suit}', '${card.value}')\"` : '';
    
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
 * Behandelt Kartenklicks (FIXED: Erweiterte Validierung und Debug-Output)
 * @param {string} suit - Farbe der geklickten Karte
 * @param {string} value - Wert der geklickten Karte
 */
function handleCardClick(suit, value) {
    const debugPrefix = '🃏 handleCardClick:';
    
    if (gameState.debugMode) {
        console.log(`${debugPrefix} ${suit} ${value} geklickt`);
        console.log(`${debugPrefix} gamePhase: ${gameState.gamePhase}`);
        console.log(`${debugPrefix} currentPlayer: ${gameState.currentPlayer}`);
    }
    
    // Basis-Validierungen
    if (!isPlayerTurn(0)) {
        console.warn(`${debugPrefix} Nicht am Zug - currentPlayer: ${gameState.currentPlayer}`);
        showModal('Nicht am Zug', 'Sie sind gerade nicht am Zug!');
        return;
    }
    
    // Explizite Spielphasen-Prüfung
    if (gameState.gamePhase !== 'playing') {
        console.warn(`${debugPrefix} Falsche Spielphase: ${gameState.gamePhase}`);
        showModal('Nicht spielbereit', `Spiel ist in Phase: ${gameState.gamePhase}`);
        return;
    }
    
    // Karte in Spielerhand suchen
    const player = gameState.players[0];
    const card = player.cards.find(c => c.suit === suit && c.value === value);
    
    if (!card) {
        console.error(`${debugPrefix} Karte nicht in Hand gefunden: ${suit} ${value}`);
        showModal('Kartenfehler', 'Diese Karte ist nicht in Ihrer Hand!');
        return;
    }
    
    // Erweiterte Validierung mit canPlayCard
    let canPlay = false;
    let validationMessage = '';
    
    if (typeof canPlayCard === 'function') {
        try {
            canPlay = canPlayCard(card, 0);
            if (!canPlay && typeof validateCardPlay === 'function') {
                const validation = validateCardPlay(card, 0, gameState.currentTrick, player.cards);
                validationMessage = validation.reason || 'Karte nicht spielbar';
            }
        } catch (error) {
            console.error(`${debugPrefix} canPlayCard Fehler:`, error);
            canPlay = false;
            validationMessage = 'Validierungsfehler';
        }
    } else if (typeof window.canPlayCard === 'function') {
        try {
            canPlay = window.canPlayCard(card, 0);
            if (!canPlay && typeof window.validateCardPlay === 'function') {
                const validation = window.validateCardPlay(card, 0, gameState.currentTrick, player.cards);
                validationMessage = validation.reason || 'Karte nicht spielbar';
            }
        } catch (error) {
            console.error(`${debugPrefix} window.canPlayCard Fehler:`, error);
            canPlay = false;
            validationMessage = 'Validierungsfehler';
        }
    } else {
        console.warn(`${debugPrefix} Keine canPlayCard Funktion verfügbar - verwende Fallback`);
        canPlay = true; // Fallback: Alle Karten erlauben
    }
    
    if (!canPlay) {
        console.warn(`${debugPrefix} Karte nicht spielbar: ${validationMessage}`);
        showModal('Regelverstoß', validationMessage || 'Diese Karte kann jetzt nicht gespielt werden.');
        return;
    }
    
    // Karte spielen
    if (gameState.debugMode) {
        console.log(`${debugPrefix} Spiele Karte: ${card.symbol}${card.short}`);
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
 * DEBUG: Umfassende Karten-Click-System Diagnose
 */
function debugCardClickSystem() {
    console.log('🃏 === CARD CLICK SYSTEM DIAGNOSE ===');
    
    // 1. Funktionsverfügbarkeit
    console.log('1. FUNKTIONEN:');
    console.log('  handleCardClick:', typeof handleCardClick === 'function');
    console.log('  canPlayCard:', typeof canPlayCard === 'function');
    console.log('  window.canPlayCard:', typeof window.canPlayCard === 'function');
    console.log('  validateCardPlay:', typeof validateCardPlay === 'function');
    console.log('  playCard:', typeof playCard === 'function');
    console.log('  isPlayerTurn:', typeof isPlayerTurn === 'function');
    
    // 2. Spielzustand
    console.log('2. SPIELZUSTAND:');
    console.log('  gamePhase:', gameState.gamePhase);
    console.log('  currentPlayer:', gameState.currentPlayer);
    console.log('  Human player turn:', isPlayerTurn(0));
    console.log('  Trick length:', gameState.currentTrick.length);
    
    // 3. Menschlicher Spieler
    const humanPlayer = gameState.players[0];
    console.log('3. MENSCHLICHER SPIELER:');
    console.log('  Name:', humanPlayer.name);
    console.log('  Kartenanzahl:', humanPlayer.cards.length);
    console.log('  Ist human:', humanPlayer.isHuman);
    
    // 4. Erste Karte testen
    if (humanPlayer.cards.length > 0) {
        const testCard = humanPlayer.cards[0];
        console.log('4. KARTEN-TEST (erste Karte):');
        console.log(`  Testkarte: ${testCard.symbol}${testCard.short}`);
        
        if (typeof canPlayCard === 'function') {
            try {
                const playable = canPlayCard(testCard, 0);
                console.log('  canPlayCard result:', playable);
                
                if (typeof validateCardPlay === 'function') {
                    const validation = validateCardPlay(testCard, 0, gameState.currentTrick, humanPlayer.cards);
                    console.log('  Validation:', validation);
                }
            } catch (error) {
                console.log('  canPlayCard ERROR:', error);
            }
        } else {
            console.log('  canPlayCard nicht verfügbar');
        }
    }
    
    // 5. UI-Elemente
    console.log('5. UI-ELEMENTE:');
    const cardsContainer = document.getElementById('cards-0');
    console.log('  cards-0 container:', !!cardsContainer);
    if (cardsContainer) {
        console.log('  Container children:', cardsContainer.children.length);
        const playableCards = cardsContainer.querySelectorAll('.playable');
        console.log('  Spielbare Karten in UI:', playableCards.length);
        
        // Erste spielbare Karte analysieren
        if (playableCards.length > 0) {
            const firstPlayable = playableCards[0];
            console.log('  Erste spielbare Karte:');
            console.log('    onclick:', !!firstPlayable.onclick);
            console.log('    data-suit:', firstPlayable.dataset.suit);
            console.log('    data-value:', firstPlayable.dataset.value);
        }
    }
    
    console.log('🃏 === DIAGNOSE ENDE ===');
    
    return {
        functions: {
            handleCardClick: typeof handleCardClick === 'function',
            canPlayCard: typeof canPlayCard === 'function',
            windowCanPlayCard: typeof window.canPlayCard === 'function',
            validateCardPlay: typeof validateCardPlay === 'function',
            playCard: typeof playCard === 'function',
            isPlayerTurn: typeof isPlayerTurn === 'function'
        },
        gameState: {
            phase: gameState.gamePhase,
            currentPlayer: gameState.currentPlayer,
            humanTurn: isPlayerTurn(0),
            trickLength: gameState.currentTrick.length
        },
        player: {
            name: humanPlayer.name,
            cardCount: humanPlayer.cards.length,
            isHuman: humanPlayer.isHuman
        },
        ui: {
            containerExists: !!document.getElementById('cards-0'),
            playableCardsCount: document.querySelectorAll('#cards-0 .playable').length
        }
    };
}

/**
 * DEBUG: Simuliere Karten-Click für Testing
 * @param {number} cardIndex - Index der zu klickenden Karte (Standard: 0)
 */
function debugSimulateCardClick(cardIndex = 0) {
    const humanPlayer = gameState.players[0];
    if (!humanPlayer.cards[cardIndex]) {
        console.error('🃏 Karte mit Index', cardIndex, 'nicht verfügbar');
        return;
    }
    
    const card = humanPlayer.cards[cardIndex];
    console.log('🃏 Simuliere Click auf:', card.symbol + card.short);
    
    handleCardClick(card.suit, card.value);
}

// Export Debug-Funktionen global
if (typeof window !== 'undefined') {
    window.debugCardClickSystem = debugCardClickSystem;
    window.debugSimulateCardClick = debugSimulateCardClick;
    window.handleCardClick = handleCardClick;
    console.log('🔧 UI-Cards.js: Debug-Funktionen und handleCardClick global exportiert');
}