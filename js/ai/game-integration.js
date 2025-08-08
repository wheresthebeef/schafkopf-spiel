/**
 * Game Integration für Emergency Human Training
 * Verbindet das Emergency-System mit dem laufenden Spiel
 */

// Warte bis das Spiel geladen ist
window.addEventListener('load', () => {
    setTimeout(() => {
        integrateEmergencyTrainingWithGame();
    }, 2000);
});

function integrateEmergencyTrainingWithGame() {
    console.log('🎮 Integriere Emergency Training ins Spiel...');
    
    // Erweitere das Emergency Human Training System
    if (window.emergencyHumanTraining) {
        window.emergencyHumanTraining.startGameIntegration = function() {
            console.log('🎯 Game Integration gestartet');
            
            // Hook in die Bot-Entscheidungen
            this.hookBotDecisions();
            
            // Erweitere die UI
            this.addGameControls();
        };
        
        window.emergencyHumanTraining.hookBotDecisions = function() {
            // Überwache Bot-Züge im Spiel
            const originalSelectCardWithBot = window.selectCardWithBot;
            
            if (originalSelectCardWithBot) {
                window.selectCardWithBot = (playableCards, playerIndex, gameContext) => {
                    // Lass den Bot normal entscheiden
                    const selectedCard = originalSelectCardWithBot(playableCards, playerIndex, gameContext);
                    
                    // Zeige Feedback-Option für diesen Zug
                    if (this.isEnabled && selectedCard) {
                        this.showBotMoveForFeedback(playerIndex, selectedCard, playableCards, gameContext);
                    }
                    
                    return selectedCard;
                };
                
                console.log('✅ Bot-Entscheidungen werden überwacht');
            } else {
                console.log('⚠️ selectCardWithBot nicht gefunden - verwende Timer-basierte Überwachung');
                this.useTimerBasedMonitoring();
            }
        };
        
        window.emergencyHumanTraining.useTimerBasedMonitoring = function() {
            // Überwache das Spielfeld alle 2 Sekunden
            this.gameMonitorInterval = setInterval(() => {
                this.checkForNewBotMoves();
            }, 2000);
        };
        
        window.emergencyHumanTraining.checkForNewBotMoves = function() {
            // Prüfe ob sich das Spielfeld geändert hat
            const trickArea = document.getElementById('trick-area');
            if (trickArea && trickArea.children.length > this.lastTrickCount) {
                this.lastTrickCount = trickArea.children.length;
                
                // Simuliere Bot-Move für Feedback
                const playerNames = ['Du', 'Anna', 'Hans', 'Sepp'];
                const randomPlayer = Math.floor(Math.random() * 3) + 1; // Bot players 1-3
                
                this.showSimulatedBotMove(randomPlayer, playerNames[randomPlayer]);
            }
        };
        
        window.emergencyHumanTraining.showBotMoveForFeedback = function(playerIndex, selectedCard, playableCards, gameContext) {
            const moveRecord = {
                playerId: playerIndex,
                selectedCard: selectedCard,
                playableCards: playableCards || [],
                gameContext: gameContext || {},
                timestamp: Date.now(),
                trickNumber: (gameContext && gameContext.trickNumber) || 0
            };
            
            this.addMoveToFeedbackUI(moveRecord);
        };
        
        window.emergencyHumanTraining.showSimulatedBotMove = function(playerId, playerName) {
            // Simuliere einen Bot-Zug für Demo-Zwecke
            const suits = ['herz', 'eichel', 'gras', 'schellen'];
            const values = ['7', '8', '9', 'unter', 'ober', 'zehn', 'koenig', 'ass'];
            
            const selectedCard = {
                suit: suits[Math.floor(Math.random() * suits.length)],
                value: values[Math.floor(Math.random() * values.length)]
            };
            
            const playableCards = [selectedCard]; // Vereinfacht
            
            const moveRecord = {
                playerId: playerId,
                selectedCard: selectedCard,
                playableCards: playableCards,
                gameContext: { trickNumber: Math.floor(Date.now() / 10000) },
                timestamp: Date.now()
            };
            
            this.addMoveToFeedbackUI(moveRecord);
        };
        
        window.emergencyHumanTraining.addMoveToFeedbackUI = function(moveRecord) {
            const feedbackContent = document.querySelector('#emergency-human-training-ui .feedback-area');
            if (!feedbackContent) {
                this.createFeedbackArea();
            }
            
            const playerNames = ['Du', 'Anna', 'Hans', 'Sepp'];
            const playerName = playerNames[moveRecord.playerId] || `Bot ${moveRecord.playerId}`;
            
            const moveDiv = document.createElement('div');
            moveDiv.style.cssText = `
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 10px;
                margin: 8px 0;
            `;
            
            moveDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px;">
                    ${playerName}: ${moveRecord.selectedCard.suit} ${moveRecord.selectedCard.value}
                </div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="handleFeedback('${moveRecord.playerId}', 'good')" 
                            style="flex: 1; padding: 4px 8px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        👍 Gut
                    </button>
                    <button onclick="handleFeedback('${moveRecord.playerId}', 'bad')" 
                            style="flex: 1; padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        👎 Schlecht
                    </button>
                    <button onclick="handleFeedback('${moveRecord.playerId}', 'suggest')" 
                            style="flex: 1; padding: 4px 8px; background: #ffc107; color: black; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        💡 Besser wäre...
                    </button>
                </div>
            `;
            
            const feedbackArea = document.querySelector('#emergency-human-training-ui .feedback-area');
            if (feedbackArea) {
                feedbackArea.insertBefore(moveDiv, feedbackArea.firstChild);
                
                // Entferne alte Einträge (max 3)
                while (feedbackArea.children.length > 3) {
                    feedbackArea.removeChild(feedbackArea.lastChild);
                }
            }
        };
        
        window.emergencyHumanTraining.createFeedbackArea = function() {
            const ui = document.getElementById('emergency-human-training-ui');
            if (ui) {
                // Erweitere die bestehende UI
                const existingContent = ui.querySelector('div:last-child');
                if (existingContent) {
                    const feedbackArea = document.createElement('div');
                    feedbackArea.className = 'feedback-area';
                    feedbackArea.style.cssText = `
                        max-height: 200px;
                        overflow-y: auto;
                        margin-top: 10px;
                        padding-top: 10px;
                        border-top: 1px solid #dee2e6;
                    `;
                    
                    const feedbackTitle = document.createElement('div');
                    feedbackTitle.style.cssText = 'font-weight: bold; margin-bottom: 8px; font-size: 12px;';
                    feedbackTitle.textContent = 'Bot-Züge bewerten:';
                    
                    existingContent.appendChild(feedbackTitle);
                    existingContent.appendChild(feedbackArea);
                }
            }
        };
        
        // Erweitere die UI für bessere Integration
        window.emergencyHumanTraining.enhanceUI = function() {
            const ui = document.getElementById('emergency-human-training-ui');
            if (ui) {
                // Vergrößere die UI
                ui.style.width = '350px';
                ui.style.height = 'auto';
                ui.style.maxHeight = '500px';
                
                // Füge Game-Integration Toggle hinzu
                const content = ui.querySelector('div:last-child');
                if (content) {
                    const toggleButton = document.createElement('button');
                    toggleButton.textContent = '🎮 Game Integration starten';
                    toggleButton.style.cssText = `
                        width: 100%;
                        padding: 8px;
                        background: #17a2b8;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-bottom: 10px;
                    `;
                    toggleButton.onclick = () => {
                        this.startGameIntegration();
                        toggleButton.textContent = '✅ Game Integration aktiv';
                        toggleButton.style.background = '#28a745';
                    };
                    
                    content.insertBefore(toggleButton, content.firstChild);
                }
            }
        };
        
        // Initialisiere
        window.emergencyHumanTraining.lastTrickCount = 0;
        window.emergencyHumanTraining.enhanceUI();
        
        console.log('✅ Emergency Training Game Integration bereit!');
    }
}

// Feedback-Handler
window.handleFeedback = function(playerId, type) {
    console.log(`📝 Feedback für Player ${playerId}: ${type}`);
    
    const messages = {
        good: '👍 Positives Feedback registriert!',
        bad: '👎 Negatives Feedback registriert!', 
        suggest: '💡 Verbesserungsvorschlag notiert!'
    };
    
    // Zeige Bestätigung
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 10px 15px;
        border-radius: 4px;
        z-index: 10001;
        font-weight: bold;
    `;
    message.textContent = messages[type];
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 2000);
    
    // Update Stats
    if (window.emergencyHumanTraining.feedbackStats) {
        window.emergencyHumanTraining.feedbackStats[type]++;
    } else {
        window.emergencyHumanTraining.feedbackStats = { good: 0, bad: 0, suggest: 0 };
        window.emergencyHumanTraining.feedbackStats[type] = 1;
    }
    
    console.log('📊 Feedback Stats:', window.emergencyHumanTraining.feedbackStats);
};

// Auto-Integration nach Laden
setTimeout(() => {
    if (window.emergencyHumanTraining && typeof window.emergencyHumanTraining.enhanceUI === 'function') {
        window.emergencyHumanTraining.enhanceUI();
    }
}, 3000);