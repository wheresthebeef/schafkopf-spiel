/**
 * Bayerisches Schafkopf - AI Main Module
 * Zentrale Schnittstelle für das moderne AI-System
 * Löst Circular Dependencies und stellt einheitliche API bereit
 * Browser-Script Version (ohne ES6 imports)
 */

// Dependencies werden als window-globals erwartet:
// - window.SchafkopfQLearning (aus q-learning.js)
// - window.qLearningMonitor (aus q-learning.js)
// - window.SchafkopfCardMemory (aus card-memory.js)

/**
 * Haupt-AI-Manager ohne Circular Dependencies
 * Vereinfachte Version des BotManagers für saubere Integration
 */
class AISystem {
    constructor() {
        this.aiPlayers = new Map();
        this.humanFeedback = null; // Wird später gesetzt
        
        // Konfiguration
        this.defaultAIType = 'qlearning';
        this.enableLearning = true;
        
        console.log('🚀 AI-System initialisiert');
    }
    
    /**
     * Initialisiert AI für alle Bot-Spieler
     */
    initialize() {
        // Spieler 1-3 sind Bots (Spieler 0 ist Mensch)
        for (let playerId = 1; playerId <= 3; playerId++) {
            this.initializePlayer(playerId);
        }
        
        console.log('✅ Alle AI-Spieler initialisiert');
    }
    
    /**
     * Initialisiert einzelnen AI-Spieler
     */
    initializePlayer(playerId, config = {}) {
        const aiInstance = new window.SchafkopfQLearning(playerId, {
            learningRate: config.learningRate || 0.1,
            explorationRate: config.explorationRate || 0.3,
            ...config
        });
        
        // Lade gespeicherte Daten
        if (this.enableLearning) {
            aiInstance.loadFromStorage();
        }
        
        this.aiPlayers.set(playerId, {
            instance: aiInstance,
            type: 'qlearning',
            config: config,
            createdAt: Date.now()
        });
        
        console.log(`🧠 Q-Learning AI für Spieler ${playerId} initialisiert`);
    }
    
    /**
     * HAUPTFUNKTION: Lässt AI eine Karte wählen
     * Diese Funktion wird von game.js aufgerufen
     */
    selectCard(playerId, playableCards, gameContext) {
        const aiData = this.aiPlayers.get(playerId);
        
        if (!aiData) {
            console.warn(`⚠️ Keine AI für Spieler ${playerId}, initialisiere...`);
            this.initializePlayer(playerId);
            return this.selectCard(playerId, playableCards, gameContext);
        }
        
        try {
            const selectedCard = aiData.instance.selectCard(playableCards, gameContext);
            
            // Human Feedback Integration (falls verfügbar)
            if (selectedCard && this.humanFeedback && this.humanFeedback.isEnabled) {
                this.humanFeedback.recordAIMove(playerId, selectedCard, playableCards, gameContext);
            }
            
            return selectedCard;
        } catch (error) {
            console.error(`❌ AI-Fehler für Spieler ${playerId}:`, error);
            return playableCards[0]; // Emergency fallback
        }
    }
    
    /**
     * Benachrichtigt AI über abgeschlossenen Trick
     */
    onTrickCompleted(trickResult, gameContext) {
        for (const [playerId, aiData] of this.aiPlayers.entries()) {
            try {
                const ai = aiData.instance;
                const reward = ai.calculateReward(trickResult);
                
                // Q-Learning Update (vereinfacht)
                if (aiData.lastState && aiData.lastAction) {
                    const nextState = ai.encodeGameState(gameContext);
                    const done = gameContext.trickNumber >= 8;
                    
                    ai.addExperience(
                        aiData.lastState, 
                        aiData.lastAction, 
                        reward, 
                        nextState, 
                        done
                    );
                }
                
                // Karten-Memory Update
                if (trickResult.cards) {
                    trickResult.cards.forEach((card, index) => {
                        ai.cardMemory.recordCard(
                            card, 
                            trickResult.players ? trickResult.players[index] : index, 
                            gameContext.trickNumber
                        );
                    });
                }
                
            } catch (error) {
                console.error(`❌ Trick-Update Fehler Spieler ${playerId}:`, error);
            }
        }
    }
    
    /**
     * Benachrichtigt AI über abgeschlossenes Spiel
     */
    onGameCompleted(gameResult) {
        for (const [playerId, aiData] of this.aiPlayers.entries()) {
            try {
                const playerResult = {
                    won: gameResult.winners ? gameResult.winners.includes(playerId) : false,
                    score: gameResult.scores ? gameResult.scores[playerId] || 0 : 0,
                    teamWin: this.isTeamWin(playerId, gameResult)
                };
                
                aiData.instance.trainAfterGame(playerResult);
                
                // Performance Monitoring
                if (window.qLearningMonitor) {
                    window.qLearningMonitor.recordGame(playerId, {
                        ...playerResult,
                        explorationRate: aiData.instance.explorationRate
                    });
                }
                
                // Auto-Save
                aiData.instance.saveToStorage();
                
            } catch (error) {
                console.error(`❌ Game-Update Fehler Spieler ${playerId}:`, error);
            }
        }
    }
    
    /**
     * Hilfsfunktion: Team-Sieg prüfen
     */
    isTeamWin(playerId, gameResult) {
        if (gameResult.gameType === 'rufspiel') {
            const team = gameResult.teams ? gameResult.teams[playerId] : 0;
            return gameResult.winningTeam === team;
        }
        return gameResult.winners ? gameResult.winners.includes(playerId) : false;
    }
    
    /**
     * Speichert State/Action für Q-Learning
     */
    recordStateAction(playerId, state, action) {
        const aiData = this.aiPlayers.get(playerId);
        if (aiData) {
            aiData.lastState = state;
            aiData.lastAction = action;
        }
    }
    
    /**
     * Setzt Human Feedback System (Dependency Injection)
     */
    setHumanFeedback(humanFeedbackInstance) {
        this.humanFeedback = humanFeedbackInstance;
        console.log('🧑‍🏫 Human Feedback System verbunden');
    }
    
    /**
     * Holt Statistiken aller AIs
     */
    getStats() {
        const stats = {};
        for (const [playerId, aiData] of this.aiPlayers.entries()) {
            stats[playerId] = aiData.instance.getStats();
        }
        return stats;
    }
    
    /**
     * Speichert alle AI-Daten
     */
    saveAll() {
        let savedCount = 0;
        for (const [playerId, aiData] of this.aiPlayers.entries()) {
            try {
                aiData.instance.saveToStorage();
                savedCount++;
            } catch (error) {
                console.error(`❌ Speicher-Fehler Spieler ${playerId}:`, error);
            }
        }
        console.log(`💾 ${savedCount} AI-Instanzen gespeichert`);
    }
    
    /**
     * Reset für neue Trainingsphase
     */
    resetAll() {
        for (const [playerId, aiData] of this.aiPlayers.entries()) {
            aiData.instance.reset();
        }
        console.log('🔄 Alle AIs zurückgesetzt');
    }
}

/**
 * Human Feedback System (vereinfacht, ohne Circular Dependencies)
 */
class SimpleHumanFeedback {
    constructor() {
        this.isEnabled = false;
        this.feedbackHistory = [];
        this.pendingMoves = new Map();
        
        console.log('🧑‍🏫 Human Feedback System initialisiert');
    }
    
    enable() {
        this.isEnabled = true;
        this.createUI();
        console.log('✅ Human Training aktiviert');
    }
    
    disable() {
        this.isEnabled = false;
        this.removeUI();
        console.log('❌ Human Training deaktiviert');
    }
    
    recordAIMove(playerId, selectedCard, playableCards, gameContext) {
        if (!this.isEnabled) return;
        
        const moveKey = `trick_${gameContext.trickNumber}_player_${playerId}`;
        this.pendingMoves.set(moveKey, {
            playerId,
            selectedCard,
            playableCards: [...playableCards],
            gameContext: {...gameContext},
            timestamp: Date.now()
        });
        
        this.showMoveForReview(moveKey);
    }
    
    createUI() {
        // Vereinfachte UI für Human Feedback
        const container = document.createElement('div');
        container.id = 'human-feedback-ui';
        container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: 280px;
            background: rgba(255,255,255,0.95);
            border: 2px solid #007bff;
            border-radius: 8px;
            padding: 10px;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;
        
        container.innerHTML = `
            <div style="background: #007bff; color: white; padding: 8px; margin: -10px -10px 10px -10px; border-radius: 6px 6px 0 0;">
                <strong>🧑‍🏫 AI Training</strong>
                <button onclick="aiSystem.humanFeedback.disable()" style="float: right; background: none; border: none; color: white; cursor: pointer;">×</button>
            </div>
            <div id="feedback-content">
                <p>Spiele ein paar Züge - dann kannst du die AI bewerten!</p>
            </div>
        `;
        
        document.body.appendChild(container);
    }
    
    removeUI() {
        const ui = document.getElementById('human-feedback-ui');
        if (ui) ui.remove();
    }
    
    showMoveForReview(moveKey) {
        const move = this.pendingMoves.get(moveKey);
        if (!move) return;
        
        const content = document.getElementById('feedback-content');
        if (!content) return;
        
        const playerName = ['Du', 'Anna', 'Bert', 'Clara'][move.playerId] || `Bot ${move.playerId}`;
        
        const moveDiv = document.createElement('div');
        moveDiv.style.cssText = `
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 8px;
            margin: 5px 0;
        `;
        
        moveDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">
                ${playerName}: ${move.selectedCard.suit} ${move.selectedCard.value}
            </div>
            <div style="display: flex; gap: 3px;">
                <button onclick="aiSystem.humanFeedback.rateMoveGood('${moveKey}')" 
                        style="flex: 1; padding: 3px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                    Gut
                </button>
                <button onclick="aiSystem.humanFeedback.rateMoveBad('${moveKey}')"
                        style="flex: 1; padding: 3px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
                    Schlecht
                </button>
            </div>
        `;
        
        content.insertBefore(moveDiv, content.firstChild);
        
        // Nur 3 neueste Bewertungen zeigen
        while (content.children.length > 4) {
            content.removeChild(content.lastChild);
        }
    }
    
    rateMoveGood(moveKey) {
        const move = this.pendingMoves.get(moveKey);
        if (!move) return;
        
        this.applyFeedback(move, +8); // Positive Belohnung
        this.showMessage('Zug als gut bewertet!', '#28a745');
        this.pendingMoves.delete(moveKey);
    }
    
    rateMoveBad(moveKey) {
        const move = this.pendingMoves.get(moveKey);
        if (!move) return;
        
        this.applyFeedback(move, -10); // Negative Belohnung
        this.showMessage('Zug als schlecht bewertet!', '#dc3545');
        this.pendingMoves.delete(moveKey);
    }
    
    applyFeedback(move, reward) {
        const aiData = aiSystem.aiPlayers.get(move.playerId);
        if (!aiData) return;
        
        const ai = aiData.instance;
        const state = ai.encodeGameState(move.gameContext);
        const action = ai.encodeAction(move.selectedCard);
        
        // Direktes Q-Value Update mit verstärktem Feedback
        const currentQ = ai.getQValue(state, action);
        const newQ = currentQ + (ai.learningRate * reward * 2.0); // 2x Gewichtung für Human Feedback
        ai.setQValue(state, action, newQ);
        
        console.log(`🧑‍🏫 Human Feedback: Q-Update ${currentQ.toFixed(3)} → ${newQ.toFixed(3)}`);
    }
    
    showMessage(text, color) {
        const msg = document.createElement('div');
        msg.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            z-index: 1001;
            font-weight: bold;
        `;
        msg.textContent = text;
        
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    }
}

// Globale Instanzen
const aiSystem = new AISystem();
const humanFeedback = new SimpleHumanFeedback();

// Human Feedback mit AI System verbinden (Dependency Injection)
aiSystem.setHumanFeedback(humanFeedback);

/**
 * LEGACY-KOMPATIBLE FUNKTIONEN
 * Diese Funktionen werden von game.js aufgerufen
 */

/**
 * Hauptfunktion: Ersetzt selectCardWithAI aus game.js
 */
function selectCardWithAI(playableCards, playerIndex, gameContext = null) {
    // Sichere Initialisierung falls noch nicht geschehen
    if (aiSystem.aiPlayers.size === 0) {
        aiSystem.initialize();
    }
    
    const context = gameContext || buildGameContext();
    return aiSystem.selectCard(playerIndex, playableCards, context);
}

/**
 * Legacy-Kompatibilität: selectCardWithBot
 */
function selectCardWithBot(playableCards, playerIndex, gameContext = null) {
    return selectCardWithAI(playableCards, playerIndex, gameContext);
}

/**
 * Baut Game Context aus globalem gameState
 */
function buildGameContext() {
    if (typeof window !== 'undefined' && window.gameState) {
        const gs = window.gameState;
        return {
            currentTrick: gs.currentTrick || [],
            trickNumber: gs.trickNumber || 0,
            players: gs.players || [],
            completedTricks: gs.completedTricks || [],
            gameType: gs.gameType || 'rufspiel',
            trumpSuit: gs.trumpSuit || 'herz',
            calledAce: gs.calledAce,
            calledAcePlayer: gs.calledAcePlayer,
            caller: gs.caller
        };
    }
    
    // Fallback
    return {
        currentTrick: [],
        trickNumber: 0,
        players: [],
        completedTricks: [],
        gameType: 'rufspiel',
        trumpSuit: 'herz',
        calledAce: null,
        calledAcePlayer: -1,
        caller: 0
    };
}

/**
 * Spiel-Event-Handler
 */
function notifyAITrickCompleted(trickResult) {
    const context = buildGameContext();
    aiSystem.onTrickCompleted(trickResult, context);
}

function notifyAIGameCompleted(gameResult) {
    aiSystem.onGameCompleted(gameResult);
}

/**
 * Browser-globale Verfügbarkeit
 */
if (typeof window !== 'undefined') {
    // AI-System global verfügbar machen
    window.aiSystem = aiSystem;
    window.humanFeedback = humanFeedback;
    
    // Hauptfunktionen
    window.selectCardWithAI = selectCardWithAI;
    window.selectCardWithBot = selectCardWithBot;
    
    // Event-Handler
    window.notifyAITrickCompleted = notifyAITrickCompleted;
    window.notifyAIGameCompleted = notifyAIGameCompleted;
    
    // Convenience-Funktionen
    window.enableHumanTraining = () => humanFeedback.enable();
    window.disableHumanTraining = () => humanFeedback.disable();
    window.getAIStats = () => aiSystem.getStats();
    window.saveAIData = () => aiSystem.saveAll();
    window.resetAIData = () => aiSystem.resetAll();
    
    console.log('🌟 AI-System global verfügbar');
}

// Auto-Initialisierung wenn DOM geladen
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        aiSystem.initialize();
        console.log('🚀 AI-System auto-initialisiert');
    });
}
