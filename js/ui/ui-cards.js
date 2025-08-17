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
 * Behandelt Kartenklicks (FIXED: Bidding-Phase-Check entfernt)
 * @param {string} suit - Farbe der geklickten Karte
 * @param {string} value - Wert der geklickten Karte
 */
function handleCardClick(suit, value) {
    // Nur menschliche Spieler können Karten klicken
    if (!isPlayerTurn(0)) {
        showModal('Nicht am Zug', 'Sie sind gerade nicht am Zug!');
        return;
    }
    
    // FIXED: Bidding-Check entfernt - Bidding-Modal übernimmt das
    // Spielphase wird vom Bidding-System korrekt auf 'playing' gesetzt
    
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