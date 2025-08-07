/**
 * Bayerisches Schafkopf - Globaler API-Wrapper
 * Macht ES6-Module im globalen Scope verfügbar für HTML onclick-Handler
 */

// Import aller benötigten Module
import { initializeGameState, getGameStateInternal, setGamePhase, finishGame } from './core/game-state.js';
import { GAME_PHASES, GAME_TYPES, SUIT_NAMES } from './core/constants.js';
import { logGameAction } from './core/utils.js';
import { createDeck, setTrumpStatus, isCardHigher, findCard, debugTrumpOrder, debugCards } from './cards/cards.js';
import { shuffleDeck, dealCards } from './cards/deck.js';
import { sortCardsForDisplay, evaluateHand } from './cards/card-utils.js';

/**
 * Startet ein neues Spiel (Neue ES6-Module-Version)
 */
function newGameModern() {
    logGameAction('Neues Spiel gestartet (ES6-Module)');
    
    // Continue-Button verstecken falls noch sichtbar
    const continueContainer = document.getElementById('continue-container');
    if (continueContainer) {
        continueContainer.style.display = 'none';
    }
    
    // Spielzustand initialisieren
    const currentDebugMode = window.gameState?.debugMode || true;
    const gameState = initializeGameState({
        debugMode: currentDebugMode
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
    
    // Spielphase auf Ass-Auswahl setzen
    setGamePhase(GAME_PHASES.BIDDING);
    gameState.currentPlayer = 0;
    
    // UI aktualisieren (Legacy-Funktionen verwenden)
    if (window.updateUI) window.updateUI();
    if (window.updateGameStatus) window.updateGameStatus('Wählen Sie ein Ass für das Rufspiel...');
    
    // Ass-Auswahl anzeigen
    showAceSelectionModern();
    
    if (gameState.debugMode) {
        console.log('=== Neues Spiel (ES6-Module) ===');
        gameState.players.forEach((player, index) => {
            debugCards(player.cards, `${player.name} (${index})`);
        });
        
        if (!window.trumpOrderShown) {
            debugTrumpOrder(shuffledDeck);
            window.trumpOrderShown = true;
        }
    }
}

/**
 * Zeigt die Ass-Auswahl für das Rufspiel (ES6-Module-Version)
 */
function showAceSelectionModern() {
    const gameState = getGameStateInternal();
    const humanPlayer = gameState.players[0];
    const availableAces = getAvailableAcesForCallModern(humanPlayer.cards);
    
    if (availableAces.length === 0) {
        if (window.showModal) {
            window.showModal('Kein Ass rufbar', 
                'Sie können kein Ass rufen. Das Spiel wird als Ramsch gespielt oder Sie können ein Solo ansagen.',
                () => handleNoAceCallableModern()
            );
        }
        return;
    }
    
    showAceSelectionButtonsModern(availableAces);
}

/**
 * Ermittelt welche Asse der Spieler rufen kann (ES6-Module-Version)
 */
function getAvailableAcesForCallModern(playerCards) {
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
        
        if (hasAce) return;
        
        // Prüfen ob Spieler mindestens eine Karte der Farbe hat
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
 * Zeigt die Ass-Auswahl Buttons (ES6-Module-Version)
 */
function showAceSelectionButtonsModern(availableAces) {
    const cardsContainer = document.getElementById('cards-0');
    if (!cardsContainer) return;
    
    let selectionContainer = document.getElementById('ace-selection-container');
    if (!selectionContainer) {
        selectionContainer = document.createElement('div');
        selectionContainer.id = 'ace-selection-container';
        selectionContainer.className = 'ace-selection-container';
        cardsContainer.parentNode.insertBefore(selectionContainer, cardsContainer.nextSibling);
    }
    
    selectionContainer.innerHTML = `
        <div class="ace-selection-prompt">
            <strong>🃏 Rufspiel: Wählen Sie ein Ass</strong>
            <div class="ace-selection-help">Herz ist Trumpf - Sie können nur Asse rufen, wenn Sie die passende Farbe haben</div>
        </div>
        <div class="ace-selection-buttons-inline">
            ${availableAces.map(ace => `
                <button class="btn ace-btn-inline" onclick="selectAceForCallModern('${ace.suit}')">
                    <span class="ace-name">${ace.name}</span>
                </button>
            `).join('')}
            <button class="btn cancel-btn-inline" onclick="cancelAceSelectionModern()">
                Abbrechen
            </button>
        </div>
    `;
    
    if (window.updateGameStatus) {
        window.updateGameStatus('Wählen Sie ein Ass für das Rufspiel...');
    }
}

/**
 * Behandelt die Auswahl eines Asses (ES6-Module-Version)
 */
function selectAceForCallModern(suit) {
    const gameState = getGameStateInternal();
    
    gameState.calledAce = suit;
    gameState.gameType = GAME_TYPES.RUFSPIEL.id;
    gameState.calledSuitPlayed = false;
    
    findPartnerWithAceModern(suit);
    hideAceSelectionButtonsModern();
    startGameAfterAceSelectionModern();
    
    logGameAction('Ass gerufen (ES6)', { suit, partner: gameState.calledAcePlayer });
    
    if (gameState.debugMode) {
        console.log(`🎯 ${SUIT_NAMES[suit]}-Ass gerufen - Partner ist ${gameState.players[gameState.calledAcePlayer].name}`);
    }
}

/**
 * Findet den Partner anhand des gerufenen Asses (ES6-Module-Version)
 */
function findPartnerWithAceModern(suit) {
    const gameState = getGameStateInternal();
    
    for (let i = 1; i < gameState.players.length; i++) {
        const hasAce = gameState.players[i].cards.some(card => 
            card.suit === suit && card.value === 'sau'
        );
        
        if (hasAce) {
            gameState.calledAcePlayer = i;
            
            // Partnerschaft setzen
            gameState.playerPartnership[0] = 0;
            gameState.playerPartnership[1] = (i === 1) ? 0 : 1;
            gameState.playerPartnership[2] = (i === 2) ? 0 : 1;
            gameState.playerPartnership[3] = (i === 3) ? 0 : 1;
            
            if (gameState.debugMode) {
                console.log(`Partner gefunden: ${gameState.players[i].name} hat ${SUIT_NAMES[suit]}-Ass`);
                console.log('Team-Zuordnung:', gameState.playerPartnership);
            }
            return;
        }
    }
    
    console.warn('Gerufenes Ass nicht gefunden!');
    gameState.calledAcePlayer = -1;
}

/**
 * Startet das Spiel nach der Ass-Auswahl (ES6-Module-Version)
 */
function startGameAfterAceSelectionModern() {
    const gameState = getGameStateInternal();
    
    setGamePhase(GAME_PHASES.PLAYING);
    gameState.currentPlayer = 0;
    
    if (window.updateUI) window.updateUI();
    if (window.updateGameStatus) window.updateGameStatus('Rufspiel gestartet - Sie beginnen!');
    
    if (gameState.debugMode && gameState.calledAcePlayer >= 0) {
        const partnerName = gameState.players[gameState.calledAcePlayer].name;
        if (window.showToast) window.showToast(`Ihr Partner: ${partnerName}`, 3000);
    }
}

/**
 * Entfernt die Ass-Auswahl Buttons (ES6-Module-Version)
 */
function hideAceSelectionButtonsModern() {
    const selectionContainer = document.getElementById('ace-selection-container');
    if (selectionContainer) {
        selectionContainer.remove();
    }
}

/**
 * Bricht die Ass-Auswahl ab (ES6-Module-Version)
 */
function cancelAceSelectionModern() {
    hideAceSelectionButtonsModern();
    if (window.updateGameStatus) {
        window.updateGameStatus('Spiel abgebrochen - neues Spiel wird gestartet...');
    }
    setTimeout(() => {
        newGameModern();
    }, 1000);
}

/**
 * Behandelt den Fall, dass kein Ass gerufen werden kann (ES6-Module-Version)
 */
function handleNoAceCallableModern() {
    if (window.showModal) {
        window.showModal('Neues Spiel', 'Es wird ein neues Spiel gestartet.', () => {
            newGameModern();
        });
    }
}

/**
 * Zeigt die Spielregeln an (ES6-Module-Version)
 */
function showRulesModern() {
    const rulesText = `Bayerisches Schafkopf - Spielregeln (ES6-Module-Version)

ZIEL:
• 61 von 120 Punkten erreichen (im Team bei Rufspiel)
• Bei 91+ Punkten: "Mit Schneider" gewonnen
• Bei 0 Punkten: "Schwarz" verloren

RUFSPIEL:
• Sie wählen ein Ass (außer Herz-Ass)
• Der Spieler mit diesem Ass wird Ihr Partner
• Ihr Team muss zusammen 61+ Punkte erreichen

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

STEUERUNG:
• Karte anklicken zum Spielen
• F1: Diese Hilfe
• F2: Debug-Modus umschalten
• Strg+N: Neues Spiel`;

    if (window.showModal) {
        window.showModal('Spielregeln', rulesText);
    }
}

/**
 * Schaltet den Debug-Modus um (ES6-Module-Version)
 */
function toggleDebugModeModern() {
    const gameState = getGameStateInternal();
    const newMode = !gameState.debugMode;
    gameState.debugMode = newMode;
    
    if (window.updateUI) window.updateUI();
    
    const message = newMode ? 
        'Debug-Modus aktiviert (ES6-Module)\n\nAlle Karten sind jetzt sichtbar.' :
        'Debug-Modus deaktiviert (ES6-Module)\n\nCPU-Karten sind wieder verdeckt.';
    
    if (window.showToast) window.showToast(message, 2000);
}

// Alle Funktionen global verfügbar machen
window.newGameModern = newGameModern;
window.selectAceForCallModern = selectAceForCallModern;
window.cancelAceSelectionModern = cancelAceSelectionModern;
window.showRulesModern = showRulesModern;
window.toggleDebugModeModern = toggleDebugModeModern;

// Alias für Legacy-Kompatibilität
window.newGame = window.newGame || newGameModern;
window.selectAceForCall = window.selectAceForCall || selectAceForCallModern;
window.cancelAceSelection = window.cancelAceSelection || cancelAceSelectionModern;
window.showRules = window.showRules || showRulesModern;
window.toggleDebugMode = window.toggleDebugMode || toggleDebugModeModern;

// Module-Informationen für Debugging
window.moduleInfo = {
    version: '0.4.0',
    type: 'ES6-Modules',
    loadedModules: [
        'core/game-state.js',
        'core/constants.js', 
        'core/utils.js',
        'cards/cards.js',
        'cards/deck.js',
        'cards/card-utils.js'
    ]
};

console.log('✅ ES6-Module-Wrapper geladen - Funktionen sind global verfügbar');
console.log('📦 Verfügbare Module:', window.moduleInfo);
