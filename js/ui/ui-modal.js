/**
 * UI Modal Module - Modal, Events und Hilfsfunktionen
 * Verwaltet Modals, Events und allgemeine UI-Hilfsfunktionen
 */

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
    
    // NEU: Ruf-Ass Debug-Status anzeigen
    debugCalledAceStatus();
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

// Event-Listener beim Laden initialisieren
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializeEventListeners);
}