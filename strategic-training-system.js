// Enhanced Strategic Training System - Fixed Initialization
// Replaces simple good/bad with strategic context and optional reasoning

class StrategicTrainingSystem {
    constructor() {
        this.isEnabled = false;
        this.currentReviewQueue = [];
        this.pendingReviews = [];
        
        console.log('🎯 Strategic Training System initialisiert');
        
        // FIXED: Delayed initialization with better error handling
        setTimeout(() => {
            this.initializeSystem();
        }, 1500);
    }

    async initializeSystem() {
        console.log('🔄 Strategic Training: Warte auf Game Engine...');
        
        // Warte auf Spiel-Engine
        const gameEngineFound = await this.waitForGameEngine();
        
        if (gameEngineFound) {
            // Setup Event Listeners
            this.setupGameEventListeners();
            console.log('✅ Strategic Training System bereit - mit Game Engine Integration');
        } else {
            console.log('📝 Strategic Training System bereit - im Fallback-Modus');
            this.setupFallbackMode();
        }
    }

    async waitForGameEngine() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20; // Reduziert von 30
            
            const checkEngine = () => {
                // FIXED: Verbesserte Game Engine Erkennung
                const gameEngineAvailable = this.findGameEngine();
                
                if (gameEngineAvailable) {
                    console.log('🎮 Game Engine gefunden');
                    resolve(true);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    console.log(`⏳ Game Engine suchen... (${attempts}/${maxAttempts})`);
                    setTimeout(checkEngine, 500);
                } else {
                    console.log('⚠️ Game Engine nicht gefunden - Fallback Modus');
                    resolve(false);
                }
            };
            checkEngine();
        });
    }

    findGameEngine() {
        // FIXED: Verbesserte Erkennung verschiedener Game Engine Varianten
        
        // 1. Hauptspiel-State
        if (window.gameState && typeof window.gameState === 'object') {
            console.log('🎯 Haupt Game State gefunden');
            return true;
        }
        
        // 2. Alternatives Game-Objekt
        if (window.game && typeof window.game === 'object') {
            console.log('🎯 Game-Objekt gefunden');
            return true;
        }
        
        // 3. Grundlegende Spiel-Funktionen
        if (typeof window.newGame === 'function' && 
            typeof window.showStats === 'function') {
            console.log('🎯 Grundlegende Spiel-Funktionen gefunden');
            return true;
        }
        
        // 4. DOM-basierte Erkennung
        if (document.getElementById('trick-area') && 
            document.getElementById('game-status')) {
            console.log('🎯 Game-Interface gefunden');
            return true;
        }
        
        return false;
    }

    setupFallbackMode() {
        // FIXED: Fallback-Modus für bessere Kompatibilität
        this.isEnabled = true; // System auch ohne Game Engine nutzbar
        console.log('📝 Fallback-Modus: Strategic Training ohne Game Engine Integration');
        
        // Erstelle Demo-Event Listener für Tests
        this.setupDemoEventListeners();
    }

    setupDemoEventListeners() {
        // Demo-Funktionen für Tests
        window.addEventListener('demoReview', (event) => {
            this.onBotCardPlayed(event.detail);
        });
    }

    setupGameEventListeners() {
        // Lausche auf Bot-Züge
        window.addEventListener('botCardPlayed', (event) => {
            this.onBotCardPlayed(event.detail);
        });
        
        // Lausche auf Stich-Ende
        window.addEventListener('trickCompleted', (event) => {
            this.onTrickCompleted(event.detail);
        });
        
        // FIXED: Alternative Event-Listener für verschiedene Game Engine Varianten
        window.addEventListener('cardPlayed', (event) => {
            if (event.detail && event.detail.isBot) {
                this.onBotCardPlayed(event.detail);
            }
        });
        
        // Lausche auf Game State Changes
        window.addEventListener('gameStateChanged', (event) => {
            this.onGameStateChange(event.detail);
        });
    }

    onBotCardPlayed(botMoveData) {
        if (!this.isEnabled) return;
        
        console.log('🤖 Bot-Zug registriert:', botMoveData);
        
        // Sammle strategischen Kontext
        const strategicContext = this.gatherStrategicContext(botMoveData);
        
        // Zeige Review-Modal nach kurzer Verzögerung
        setTimeout(() => {
            this.showStrategicReviewModal(strategicContext);
        }, 1500);
    }

    onTrickCompleted(trickData) {
        if (!this.isEnabled) return;
        console.log('🎯 Stich beendet:', trickData);
        // Hier könnte man zusätzliche Logik für Stich-Ende hinzufügen
    }

    onGameStateChange(gameData) {
        if (!this.isEnabled) return;
        console.log('🎯 Game State geändert:', gameData);
        // Hier könnte man auf Spielzustand-Änderungen reagieren
    }

    gatherStrategicContext(botMoveData) {
        const gameState = this.getCurrentGameState();
        const stichInfo = this.getCurrentStichInfo();
        
        return {
            // Bot Info
            botName: botMoveData.playerName || botMoveData.botName || 'Unbekannt',
            cardPlayed: botMoveData.card || botMoveData.cardPlayed || 'Unbekannt',
            
            // Spiel Kontext
            gameType: gameState.gameType || 'rufspiel',
            stichNumber: stichInfo.stichNumber || 1,
            
            // Strategischer Kontext
            playerRole: this.determinePlayerRole(botMoveData.playerId, gameState),
            stichPosition: this.determineStichPosition(botMoveData.playerId, stichInfo),
            
            // Zusätzlicher Kontext
            trumpSuit: gameState.trumpSuit || 'herz',
            calledAce: gameState.calledAce || null,
            cardsInHand: this.estimateCardsInHand(stichInfo.stichNumber),
            
            // Meta
            timestamp: new Date().toISOString(),
            gameId: gameState.gameId || Date.now().toString()
        };
    }

    getCurrentGameState() {
        // FIXED: Robustere Game State Sammlung
        try {
            // Versuche verschiedene Game State Quellen
            if (window.gameState && typeof window.gameState === 'object') {
                return {
                    gameType: window.gameState.gameType || 'rufspiel',
                    trumpSuit: window.gameState.trumpSuit || 'herz',
                    calledAce: window.gameState.calledAce,
                    gameId: window.gameState.gameId || Date.now().toString(),
                    caller: window.gameState.caller,
                    partner: window.gameState.partner
                };
            }
            
            // Fallback auf globale Variablen
            return {
                gameType: window.currentGameType || 'rufspiel',
                trumpSuit: window.trumpSuit || 'herz',
                calledAce: window.calledAce || null,
                gameId: Date.now().toString(),
                caller: null,
                partner: null
            };
        } catch (error) {
            console.warn('⚠️ Fehler beim Game State sammeln:', error);
            return {
                gameType: 'rufspiel',
                trumpSuit: 'herz',
                calledAce: null,
                gameId: Date.now().toString(),
                caller: null,
                partner: null
            };
        }
    }

    getCurrentStichInfo() {
        // FIXED: Robustere Stich-Information
        try {
            // Aktuelle Stich-Information sammeln
            if (window.gameState && window.gameState.currentTrick) {
                return {
                    stichNumber: window.gameState.currentTrick.number || 1,
                    cardsPlayed: window.gameState.currentTrick.cards || [],
                    leadPlayer: window.gameState.currentTrick.leadPlayer
                };
            }
            
            // Alternative Quellen
            if (window.currentTrick) {
                return {
                    stichNumber: window.currentTrick || 1,
                    cardsPlayed: window.currentTrickCards || [],
                    leadPlayer: window.currentLeadPlayer || null
                };
            }
            
            // DOM-basierte Fallback-Schätzung
            const trickCounter = document.getElementById('trick-counter');
            if (trickCounter) {
                const trickText = trickCounter.textContent || '0/8';
                const currentTrick = parseInt(trickText.split('/')[0]) || 0;
                return {
                    stichNumber: currentTrick + 1,
                    cardsPlayed: [],
                    leadPlayer: null
                };
            }
            
            // Standard Fallback
            return {
                stichNumber: 1,
                cardsPlayed: [],
                leadPlayer: null
            };
        } catch (error) {
            console.warn('⚠️ Fehler beim Stich-Info sammeln:', error);
            return {
                stichNumber: 1,
                cardsPlayed: [],
                leadPlayer: null
            };
        }
    }

    determinePlayerRole(playerId, gameState) {
        // FIXED: Robustere Rollen-Bestimmung
        try {
            // Bestimme Rolle: spieler, mitspieler, gegner
            if (gameState.gameType === 'rufspiel') {
                if (playerId === gameState.caller) return 'Spieler';
                if (playerId === gameState.partner) return 'Mitspieler';
                return 'Gegner';
            } else {
                // Solo, Wenz, etc.
                if (playerId === gameState.caller) return 'Spieler';
                return 'Gegner';
            }
        } catch (error) {
            console.warn('⚠️ Fehler bei Rollen-Bestimmung:', error);
            return 'Gegner'; // Sicherer Fallback
        }
    }

    determineStichPosition(playerId, stichInfo) {
        // FIXED: Robustere Position-Bestimmung
        try {
            // Bestimme Position im aktuellen Stich
            const cardsPlayed = stichInfo.cardsPlayed || [];
            const position = cardsPlayed.length; // 0=ausspieler, 1=zweiter, etc.
            
            const positions = ['ausspieler', 'zweiter', 'dritter', 'letzter'];
            return positions[position] || 'ausspieler';
        } catch (error) {
            console.warn('⚠️ Fehler bei Position-Bestimmung:', error);
            return 'ausspieler'; // Sicherer Fallback
        }
    }

    estimateCardsInHand(stichNumber) {
        // Schätze verbleibende Karten
        try {
            return Math.max(8 - (stichNumber || 1), 0);
        } catch (error) {
            return 7; // Sicherer Fallback
        }
    }

    showStrategicReviewModal(context) {
        // Erstelle modernes Review-Modal
        const modal = this.createStrategicModal(context);
        document.body.appendChild(modal);
        
        // Zeige Modal mit Animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
    }

    createStrategicModal(context) {
        const modal = document.createElement('div');
        modal.className = 'strategic-review-modal';
        modal.innerHTML = `
            <div class="strategic-modal-content">
                <div class="strategic-header">
                    <h3>🤖 KI-Zug bewerten</h3>
                    <button class="close-btn" onclick="this.closest('.strategic-review-modal').remove()">✕</button>
                </div>
                
                <div class="move-context">
                    <div class="bot-move">
                        <strong>${context.botName}</strong> spielt <span class="card">${context.cardPlayed}</span>
                    </div>
                    <div class="context-info">
                        Stich ${context.stichNumber}, ${context.gameType}, als ${context.playerRole}, ${context.stichPosition}
                    </div>
                </div>
                
                <div class="rating-section">
                    <h4>Bewertung:</h4>
                    <div class="rating-buttons">
                        <button class="rating-btn good" data-rating="good">
                            ⭐ Gut
                        </button>
                        <button class="rating-btn bad" data-rating="bad">
                            ❌ Schlecht
                        </button>
                    </div>
                </div>
                
                <div class="reasoning-section">
                    <h4>Begründung (optional):</h4>
                    <textarea 
                        class="reasoning-input" 
                        placeholder="z.B. 'Hätte Trump sparen sollen für später' oder 'Perfektes Timing'"
                        maxlength="200"
                        rows="3"
                    ></textarea>
                    <div class="char-counter">0/200</div>
                </div>
                
                <div class="action-buttons">
                    <button class="submit-btn" disabled onclick="window.strategicTraining.submitReview(this)">
                        📝 Bewertung abschicken
                    </button>
                    <button class="skip-btn" onclick="this.closest('.strategic-review-modal').remove()">
                        ⏭️ Überspringen
                    </button>
                </div>
            </div>
            
            <style>
                .strategic-review-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .strategic-review-modal.show {
                    opacity: 1;
                }
                
                .strategic-modal-content {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                
                .strategic-review-modal.show .strategic-modal-content {
                    transform: scale(1);
                }
                
                .strategic-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 15px;
                }
                
                .strategic-header h3 {
                    margin: 0;
                    color: #2a5298;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5em;
                    cursor: pointer;
                    color: #999;
                    padding: 5px;
                }
                
                .close-btn:hover {
                    color: #333;
                }
                
                .move-context {
                    background: linear-gradient(145deg, #f8f9fa, #e9ecef);
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                .bot-move {
                    font-size: 1.2em;
                    margin-bottom: 8px;
                }
                
                .card {
                    background: #2a5298;
                    color: white;
                    padding: 3px 8px;
                    border-radius: 5px;
                    font-weight: bold;
                }
                
                .context-info {
                    font-size: 0.9em;
                    color: #666;
                }
                
                .rating-section {
                    margin-bottom: 20px;
                }
                
                .rating-section h4 {
                    margin-bottom: 10px;
                    color: #333;
                }
                
                .rating-buttons {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }
                
                .rating-btn {
                    padding: 12px 24px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    font-size: 1em;
                    transition: all 0.2s ease;
                    min-width: 120px;
                }
                
                .rating-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                
                .rating-btn.good {
                    border-color: #28a745;
                }
                
                .rating-btn.good.selected {
                    background: #28a745;
                    color: white;
                }
                
                .rating-btn.bad {
                    border-color: #dc3545;
                }
                
                .rating-btn.bad.selected {
                    background: #dc3545;
                    color: white;
                }
                
                .reasoning-section {
                    margin-bottom: 20px;
                }
                
                .reasoning-section h4 {
                    margin-bottom: 10px;
                    color: #333;
                }
                
                .reasoning-input {
                    width: 100%;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    padding: 12px;
                    font-family: inherit;
                    font-size: 0.9em;
                    resize: vertical;
                    transition: border-color 0.2s ease;
                }
                
                .reasoning-input:focus {
                    border-color: #2a5298;
                    outline: none;
                }
                
                .char-counter {
                    text-align: right;
                    font-size: 0.8em;
                    color: #999;
                    margin-top: 5px;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }
                
                .submit-btn {
                    background: #2a5298;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1em;
                    transition: all 0.2s ease;
                    min-width: 150px;
                }
                
                .submit-btn:enabled:hover {
                    background: #1e3c72;
                    transform: translateY(-2px);
                }
                
                .submit-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                .skip-btn {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1em;
                    transition: all 0.2s ease;
                }
                
                .skip-btn:hover {
                    background: #5a6268;
                    transform: translateY(-2px);
                }
            </style>
        `;
        
        // Event Listeners für das Modal
        this.setupModalEventListeners(modal, context);
        
        return modal;
    }

    setupModalEventListeners(modal, context) {
        // Rating Button Logic
        const ratingButtons = modal.querySelectorAll('.rating-btn');
        const submitBtn = modal.querySelector('.submit-btn');
        const reasoningInput = modal.querySelector('.reasoning-input');
        const charCounter = modal.querySelector('.char-counter');
        
        let selectedRating = null;
        
        ratingButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove previous selection
                ratingButtons.forEach(b => b.classList.remove('selected'));
                
                // Add selection to clicked button
                btn.classList.add('selected');
                selectedRating = btn.dataset.rating;
                
                // Enable submit button
                submitBtn.disabled = false;
                
                // Store rating in modal data
                modal.dataset.rating = selectedRating;
            });
        });
        
        // Character counter for reasoning
        reasoningInput.addEventListener('input', () => {
            const length = reasoningInput.value.length;
            charCounter.textContent = `${length}/200`;
            
            if (length > 180) {
                charCounter.style.color = '#dc3545';
            } else {
                charCounter.style.color = '#999';
            }
        });
        
        // Store context in modal for submission
        modal.strategicContext = context;
    }

    submitReview(submitButton) {
        const modal = submitButton.closest('.strategic-review-modal');
        const rating = modal.dataset.rating;
        const reasoning = modal.querySelector('.reasoning-input').value.trim();
        const context = modal.strategicContext;
        
        if (!rating) {
            alert('⚠️ Bitte wähle eine Bewertung aus');
            return;
        }
        
        // Erstelle strategisches Review
        const strategicReview = {
            // Basis Rating
            rating: rating,
            reasoning: reasoning || null,
            
            // Strategischer Kontext (von Game Engine)
            botName: context.botName,
            cardPlayed: context.cardPlayed,
            gameContext: {
                gameType: context.gameType,
                stichNumber: context.stichNumber,
                playerRole: context.playerRole,
                stichPosition: context.stichPosition,
                trumpSuit: context.trumpSuit,
                calledAce: context.calledAce
            },
            
            // Meta
            timestamp: context.timestamp,
            gameId: context.gameId,
            version: '2.1-strategic-fixed'
        };
        
        console.log('🎯 Strategic Review erstellt:', strategicReview);
        
        // Sende an Community System
        this.submitToCommunitySystems(strategicReview);
        
        // Schließe Modal mit Feedback
        this.closeModalWithFeedback(modal, rating);
    }

    submitToCommunitySystems(review) {
        // Sende an bestehende Systeme
        try {
            if (window.submitSecureTrainingReview) {
                window.submitSecureTrainingReview(review);
                console.log('📤 Review an Secure Training System gesendet');
            }
            
            // Trigger Q-Learning Update
            if (window.qLearningBridge) {
                setTimeout(() => {
                    window.qLearningBridge.processNewReviews();
                }, 1000);
                console.log('🧠 Q-Learning Bridge Update ausgelöst');
            }
            
            // Trigger Community DB Update
            if (window.communityDB) {
                console.log('🌍 Community DB über neues Review informiert');
            }
            
            console.log('📤 Strategic Review an alle verfügbaren Community-Systeme gesendet');
        } catch (error) {
            console.error('❌ Fehler beim Senden an Community-Systeme:', error);
        }
    }

    closeModalWithFeedback(modal, rating) {
        // Zeige kurzes Feedback
        const feedback = document.createElement('div');
        feedback.className = 'submission-feedback';
        feedback.innerHTML = `
            <div class="feedback-content">
                ${rating === 'good' ? '✅' : '❌'} Bewertung gespeichert!
                <div>Danke für dein Feedback</div>
            </div>
            
            <style>
                .submission-feedback {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    z-index: 10001;
                    text-align: center;
                }
                .feedback-content {
                    font-size: 1.1em;
                    color: #333;
                }
            </style>
        `;
        
        document.body.appendChild(feedback);
        
        // Entferne Modal und Feedback
        setTimeout(() => {
            modal.remove();
            feedback.remove();
        }, 1500);
    }

    // Public API
    enable() {
        this.isEnabled = true;
        console.log('🎯 Strategic Training aktiviert');
    }

    disable() {
        this.isEnabled = false;
        console.log('🎯 Strategic Training deaktiviert');
    }

    isActive() {
        return this.isEnabled;
    }

    // Test-Funktion
    showTestModal() {
        const testContext = {
            botName: 'Anna',
            cardPlayed: '♥️O',
            gameType: 'rufspiel',
            stichNumber: 3,
            playerRole: 'Gegner',
            stichPosition: 'dritter',
            trumpSuit: 'herz',
            calledAce: '♠️A',
            timestamp: new Date().toISOString(),
            gameId: 'test_' + Date.now()
        };
        
        this.showStrategicReviewModal(testContext);
    }

    // FIXED: Demo-Trigger für Tests
    triggerDemoReview() {
        const demoData = {
            playerName: 'Hans',
            card: '♦️K',
            playerId: 2,
            isBot: true
        };
        
        console.log('🎭 Demo Review ausgelöst');
        this.onBotCardPlayed(demoData);
    }
}

// FIXED: Wait for DOM before initializing
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Globale Instanz
        if (!window.strategicTraining) {
            window.strategicTraining = new StrategicTrainingSystem();
        }
    }, 500);
});

// Integration mit bestehendem System
setTimeout(() => {
    if (window.postGameTraining) {
        const originalEnable = window.postGameTraining.enable;
        const originalDisable = window.postGameTraining.disable;
        
        if (originalEnable) {
            window.postGameTraining.enable = function() {
                originalEnable.call(this);
                if (window.strategicTraining) {
                    window.strategicTraining.enable();
                }
            };
        }
        
        if (originalDisable) {
            window.postGameTraining.disable = function() {
                originalDisable.call(this);
                if (window.strategicTraining) {
                    window.strategicTraining.disable();
                }
            };
        }
    }
}, 3000);

// Debug-Funktionen
window.showStrategicTestModal = function() {
    if (window.strategicTraining) {
        window.strategicTraining.showTestModal();
    } else {
        console.warn('⚠️ Strategic Training System nicht verfügbar');
    }
};

window.triggerDemoStrategicReview = function() {
    if (window.strategicTraining) {
        window.strategicTraining.triggerDemoReview();
    } else {
        console.warn('⚠️ Strategic Training System nicht verfügbar');
    }
};

console.log('🎯 Strategic Training System geladen - Fixed Version mit robuster Initialisierung');

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StrategicTrainingSystem;
}
