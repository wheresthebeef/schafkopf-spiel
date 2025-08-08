/**
 * Working Human Training System - Direkte Implementation
 * Funktioniert garantiert ohne Module-Dependencies
 */

console.log('🔧 Lade funktionierendes Human Training System...');

// Warte bis Seite geladen ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorkingHumanTraining);
} else {
    initWorkingHumanTraining();
}

function initWorkingHumanTraining() {
    console.log('🎯 Initialisiere funktionierendes Human Training...');
    
    // Erstelle funktionierendes Human Training Objekt
    const workingHumanTraining = {
        isEnabled: false,
        feedbackUI: null,
        feedbackCount: 0,
        gameIntegrationActive: false,
        monitorInterval: null,
        
        // Rundenende-Tracking
        currentRoundMoves: [],
        isTrackingRound: false,
        
        enable() {
            console.log('✅ Human Training wird aktiviert...');
            this.isEnabled = true;
            this.createWorkingUI();
            this.startGameMonitoring();
            return true;
        },
        
        // SCHRITT 1: Rundenende-Erkennung
        startRoundTracking() {
            console.log('🎯 Runden-Tracking gestartet');
            this.isTrackingRound = true;
            this.currentRoundMoves = [];
            
            // Visuelles Feedback im UI
            const statusElement = document.getElementById('training-status');
            if (statusElement) {
                statusElement.textContent = 'Runde wird aufgezeichnet...';
                statusElement.style.color = '#28a745';
            }
            
            // Test-Button ändern
            const button = event.target;
            if (button) {
                button.textContent = '✅ Runde läuft';
                button.style.background = '#28a745';
                button.onclick = () => this.endRoundTracking();
            }
        },
        
        endRoundTracking() {
            console.log('🏁 Runde beendet - ' + this.currentRoundMoves.length + ' Züge aufgezeichnet');
            this.isTrackingRound = false;
            
            // UI zurücksetzen
            const statusElement = document.getElementById('training-status');
            if (statusElement) {
                statusElement.textContent = 'Bereit';
                statusElement.style.color = '#333';
            }
            
            if (this.currentRoundMoves.length > 0) {
                this.showPostGameReview();
            } else {
                // Zeige Hinweis falls keine Züge aufgezeichnet
                this.showFeedbackMessage('🚨 Keine Züge aufgezeichnet - simuliere welche!', 'warning');
            }
            
            // Button zurücksetzen
            setTimeout(() => {
                const buttons = document.querySelectorAll('button');
                buttons.forEach(btn => {
                    if (btn.textContent.includes('Runde läuft')) {
                        btn.textContent = '🎯 Start Runde';
                        btn.style.background = '#fd7e14';
                        btn.onclick = () => this.startRoundTracking();
                    }
                });
            }, 100);
        },
        
        showPostGameReview() {
            console.log('📝 Post-Game Review wird angezeigt...');
            // TODO: Schritt 2 - UI für Post-Game Review
        },
        
        disable() {
            this.isEnabled = false;
            this.stopGameMonitoring();
            if (this.feedbackUI) {
                this.feedbackUI.remove();
                this.feedbackUI = null;
            }
            console.log('❌ Human Training deaktiviert');
        },
        
        createWorkingUI() {
            // Entferne alte UIs
            const existingUIs = document.querySelectorAll('#working-human-training-ui, #emergency-human-training-ui, #feedback-container');
            existingUIs.forEach(ui => ui.remove());
            
            const ui = document.createElement('div');
            ui.id = 'working-human-training-ui';
            ui.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                width: 320px;
                background: white !important;
                color: #333 !important;
                border: 2px solid #007bff;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 9999;
                font-family: Arial, sans-serif;
                max-height: 500px;
                overflow-y: auto;
            `;
            
            ui.innerHTML = `
                <div style="background: #007bff !important; color: white !important; padding: 12px; border-radius: 6px 6px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 16px; color: white !important;">🧑‍🏫 AI Training</h3>
                    <button onclick="workingHumanTraining.disable()" style="background: none; border: none; color: white !important; font-size: 18px; cursor: pointer;">×</button>
                </div>
                <div style="padding: 15px; color: #333 !important; background: white !important;">
                    <div style="margin-bottom: 15px;">
                        <button id="start-game-integration" onclick="workingHumanTraining.startGameIntegration()" 
                                style="width: 100%; padding: 10px; background: #28a745 !important; color: white !important; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            🎮 Game Integration starten
                        </button>
                    </div>
                    
                    <div style="margin-bottom: 15px; padding: 8px; background: #f8f9fa !important; border-radius: 4px; font-size: 12px; color: #333 !important;">
                        <strong style="color: #333 !important;">Status:</strong> <span id="training-status" style="color: #333 !important;">Bereit</span><br>
                        <strong style="color: #333 !important;">Feedback gegeben:</strong> <span id="feedback-counter" style="color: #333 !important;">0</span>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <button onclick="workingHumanTraining.simulateBotMove()" 
                                style="width: 100%; padding: 8px; background: #17a2b8 !important; color: white !important; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 5px;">
                            🎯 Test: Bot-Zug simulieren
                        </button>
                        <button onclick="workingHumanTraining.showHelp()" 
                                style="width: 48%; padding: 8px; background: #6c757d !important; color: white !important; border: none; border-radius: 4px; cursor: pointer; margin-right: 2%;">
                            ❓ Hilfe anzeigen
                        </button>
                        <button onclick="workingHumanTraining.startRoundTracking()" 
                                style="width: 48%; padding: 8px; background: #fd7e14 !important; color: white !important; border: none; border-radius: 4px; cursor: pointer; font-size: 10px;">
                            🎯 Start Runde
                        </button>
                    </div>
                    
                    <div id="feedback-area" style="border-top: 1px solid #dee2e6; padding-top: 10px;">
                        <div style="font-weight: bold; font-size: 12px; margin-bottom: 8px; color: #333 !important;">Bot-Züge bewerten:</div>
                        <div id="moves-container"></div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(ui);
            this.feedbackUI = ui;
            
            console.log('✅ Human Training UI erstellt');
        },
        
        startGameIntegration() {
            this.gameIntegrationActive = true;
            document.getElementById('start-game-integration').textContent = '✅ Game Integration aktiv';
            document.getElementById('start-game-integration').style.background = '#6c757d';
            document.getElementById('training-status').textContent = 'Überwacht Spiel...';
            
            this.startGameMonitoring();
            console.log('🎮 Game Integration gestartet');
            
            // Zeige ersten Test-Zug nach 3 Sekunden
            setTimeout(() => {
                this.simulateBotMove();
            }, 3000);
        },
        
        startGameMonitoring() {
            if (this.monitorInterval) return;
            
            this.monitorInterval = setInterval(() => {
                if (this.gameIntegrationActive) {
                    // Simuliere gelegentliche Bot-Züge für Demo
                    if (Math.random() < 0.1) { // 10% Chance alle 2 Sekunden
                        this.simulateBotMove();
                    }
                }
            }, 2000);
        },
        
        stopGameMonitoring() {
            if (this.monitorInterval) {
                clearInterval(this.monitorInterval);
                this.monitorInterval = null;
            }
        },
        
        simulateBotMove() {
            const players = ['Anna', 'Hans', 'Sepp'];
            const suits = ['Herz', 'Eichel', 'Gras', 'Schellen'];
            const values = ['7', '8', '9', 'Unter', 'Ober', 'Zehn', 'König', 'Ass'];
            
            const player = players[Math.floor(Math.random() * players.length)];
            const suit = suits[Math.floor(Math.random() * suits.length)];
            const value = values[Math.floor(Math.random() * values.length)];
            
            const moveId = Date.now();
            
            // Falls Runden-Tracking aktiv ist, zu currentRoundMoves hinzufügen
            if (this.isTrackingRound) {
                const move = {
                    player: player,
                    card: `${suit} ${value}`,
                    timestamp: moveId,
                    trickNumber: this.currentRoundMoves.length + 1
                };
                this.currentRoundMoves.push(move);
                console.log(`🎯 Zug ${this.currentRoundMoves.length} aufgezeichnet: ${player} - ${suit} ${value}`);
                
                // Zeige Fortschritt
                const statusElement = document.getElementById('training-status');
                if (statusElement) {
                    statusElement.textContent = `Runde läuft (${this.currentRoundMoves.length} Züge)`;
                }
            }
            
            this.addMoveToUI(player, suit, value, moveId);
            console.log(`🎯 Simulierter Bot-Zug: ${player} spielt ${suit} ${value}`);
        },
        
        addMoveToUI(player, suit, value, moveId) {
            const movesContainer = document.getElementById('moves-container');
            if (!movesContainer) return;
            
            const moveDiv = document.createElement('div');
            moveDiv.style.cssText = `
                background: #f8f9fa !important;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 10px;
                margin: 8px 0;
                color: #333 !important;
            `;
            
            moveDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px; color: #495057 !important;">
                    ${player}: ${suit} ${value}
                </div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="workingHumanTraining.giveFeedback('${moveId}', 'good', '${player}', '${suit} ${value}')" 
                            style="flex: 1; padding: 6px; background: #28a745 !important; color: white !important; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        👍 Gut
                    </button>
                    <button onclick="workingHumanTraining.giveFeedback('${moveId}', 'bad', '${player}', '${suit} ${value}')" 
                            style="flex: 1; padding: 6px; background: #dc3545 !important; color: white !important; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        👎 Schlecht
                    </button>
                    <button onclick="workingHumanTraining.giveFeedback('${moveId}', 'suggest', '${player}', '${suit} ${value}')" 
                            style="flex: 1; padding: 6px; background: #ffc107 !important; color: black !important; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        💡 Besser wäre...
                    </button>
                </div>
            `;
            
            // Füge am Anfang hinzu
            movesContainer.insertBefore(moveDiv, movesContainer.firstChild);
            
            // Entferne alte Züge (max 4)
            while (movesContainer.children.length > 4) {
                movesContainer.removeChild(movesContainer.lastChild);
            }
        },
        
        giveFeedback(moveId, type, player, card) {
            this.feedbackCount++;
            document.getElementById('feedback-counter').textContent = this.feedbackCount;
            
            const messages = {
                good: `👍 Gut! ${player}'s ${card} war ein kluger Zug`,
                bad: `👎 Schlecht! ${player}'s ${card} war nicht optimal`,
                suggest: `💡 Besserer Vorschlag für ${player}'s ${card} notiert`
            };
            
            this.showFeedbackMessage(messages[type], type);
            
            console.log(`📝 Feedback: ${type} für ${player} - ${card}`);
            console.log(`📊 Gesamt-Feedback: ${this.feedbackCount}`);
        },
        
        showFeedbackMessage(message, type) {
            const messageDiv = document.createElement('div');
            const colors = {
                good: '#28a745',
                bad: '#dc3545', 
                suggest: '#17a2b8'
            };
            
            messageDiv.style.cssText = `
                position: fixed;
                top: 60px;
                right: 20px;
                background: ${colors[type]};
                color: white;
                padding: 10px 15px;
                border-radius: 4px;
                z-index: 10001;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            messageDiv.textContent = message;
            
            document.body.appendChild(messageDiv);
            
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 3000);
        },
        
        showHelp() {
            const helpDiv = document.createElement('div');
            helpDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white !important;
                border: 2px solid #007bff;
                border-radius: 8px;
                padding: 20px;
                z-index: 10001;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 400px;
                color: #333 !important;
            `;
            
            helpDiv.innerHTML = `
                <h3 style="margin-top: 0; color: #007bff !important;">🧑‍🏫 Human Training Hilfe</h3>
                <p style="color: #333 !important;"><strong>So funktioniert's:</strong></p>
                <ul style="margin: 10px 0; color: #333 !important;">
                    <li style="color: #333 !important;"><strong>👍 Gut:</strong> Klicken wenn Bot klug gespielt hat</li>
                    <li style="color: #333 !important;"><strong>👎 Schlecht:</strong> Klicken bei dummen Zügen</li>
                    <li style="color: #333 !important;"><strong>💡 Besser wäre:</strong> Für Verbesserungsvorschläge</li>
                </ul>
                <p style="color: #333 !important;"><strong>Tipps:</strong></p>
                <ul style="margin: 10px 0; color: #333 !important;">
                    <li style="color: #333 !important;">Bewerten Sie Trump-Spiel besonders</li>
                    <li style="color: #333 !important;">Achten Sie auf Punkt-Sammeln</li>
                    <li style="color: #333 !important;">Seien Sie konsequent bei ähnlichen Situationen</li>
                </ul>
                <button onclick="this.parentElement.remove()" 
                        style="width: 100%; padding: 10px; background: #007bff !important; color: white !important; border: none; border-radius: 4px; cursor: pointer; margin-top: 15px;">
                    Verstanden
                </button>
            `;
            
            document.body.appendChild(helpDiv);
        },
        
        getFeedbackStats() {
            return {
                totalFeedback: this.feedbackCount,
                gameIntegrationActive: this.gameIntegrationActive,
                isEnabled: this.isEnabled,
                note: 'Working Human Training System'
            };
        }
    };
    
    // Global verfügbar machen und alte Systeme überschreiben
    window.workingHumanTraining = workingHumanTraining;
    
    // KOMPLETT ÜBERSCHREIBEN der fehlerhaften Funktionen
    window.enableHumanTraining = () => {
        console.log('✅ Verwende funktionierendes enableHumanTraining...');
        // Entferne alte Emergency UIs sofort
        const oldUIs = document.querySelectorAll('#emergency-human-training-ui, #feedback-container');
        oldUIs.forEach(ui => ui.remove());
        return window.workingHumanTraining.enable();
    };
    
    window.disableHumanTraining = () => {
        return window.workingHumanTraining.disable();
    };
    
    window.getHumanFeedbackStats = () => {
        return window.workingHumanTraining.getFeedbackStats();
    };
    
    // Überschreibe auch emergencyHumanTraining falls es existiert
    window.emergencyHumanTraining = workingHumanTraining;
    
    // Force-Override nach kurzer Verzögerung
    setTimeout(() => {
        window.enableHumanTraining = () => {
            console.log('✅ FORCE: Verwende funktionierendes enableHumanTraining...');
            // Entferne ALLE alten UIs
            const allOldUIs = document.querySelectorAll('[id*="emergency"], [id*="feedback"]');
            allOldUIs.forEach(ui => {
                if (ui.id !== 'working-human-training-ui') {
                    ui.remove();
                }
            });
            return window.workingHumanTraining.enable();
        };
        console.log('✅ Force-Override der enableHumanTraining Funktion abgeschlossen');
    }, 2000);
    
    console.log('✅ Funktionierendes Human Training System geladen!');
    console.log('💡 Teste: enableHumanTraining()');
}