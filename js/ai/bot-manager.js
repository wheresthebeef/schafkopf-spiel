/**
 * Bayerisches Schafkopf - AI Bot Manager
 * Koordiniert verschiedene AI-Typen und wählt optimal zwischen ihnen
 * Integration Point zwischen Legacy-Bots und ML-System
 */

import { SchafkopfQLearning, qLearningMonitor } from './q-learning.js';

/**
 * Bot-Manager verwaltet alle AI-Typen
 * Strategische Koordination zwischen ML und Rule-based Systems
 */
export class BotManager {
    constructor() {
        // AI-Instanzen für jeden Bot-Spieler
        this.aiPlayers = new Map();
        
        // AI-Typen Konfiguration
        this.aiTypes = {
            'qlearning': { 
                name: 'Q-Learning AI', 
                description: 'Lernende KI durch Verstärkungslernen',
                adaptive: true,
                strength: 'adaptive'
            },
            'strategic': { 
                name: 'Strategische Bots', 
                description: 'Regelbasierte Experten-Strategien',
                adaptive: false,
                strength: 'consistent'
            },
            'hybrid': { 
                name: 'Hybrid AI', 
                description: 'ML-Strategien + Regel-Sicherheit',
                adaptive: true,
                strength: 'balanced'
            }
        };
        
        // Standard-Konfiguration
        this.defaultAIType = 'qlearning';
        this.enableLearning = true;
        this.autoSave = true;
        
        console.log('🤖 Bot-Manager initialisiert');
    }
    
    /**
     * Initialisiert AI für Spieler
     */
    initializeAI(playerId, aiType = null, config = {}) {
        let selectedType = aiType || this.defaultAIType;
        
        if (!this.aiTypes[selectedType]) {
            console.warn(`⚠️ Unbekannter AI-Typ: ${selectedType}, verwende ${this.defaultAIType}`);
            selectedType = this.defaultAIType;
        }
        
        let aiInstance;
        
        switch (selectedType) {
            case 'qlearning':
                aiInstance = new SchafkopfQLearning(playerId, {
                    learningRate: config.learningRate || 0.1,
                    explorationRate: config.explorationRate || 0.3,
                    ...config
                });
                
                if (this.enableLearning) {
                    aiInstance.loadFromStorage();
                }
                break;
                
            case 'strategic':
                aiInstance = new StrategicBot(playerId, config);
                break;
                
            case 'hybrid':
                aiInstance = new HybridAI(playerId, config);
                break;
                
            default:
                throw new Error(`Ununterstützter AI-Typ: ${selectedType}`);
        }
        
        this.aiPlayers.set(playerId, {
            instance: aiInstance,
            type: selectedType,
            config: config,
            createdAt: Date.now()
        });
        
        console.log(`🧠 AI ${selectedType} für Spieler ${playerId} initialisiert`);
        return aiInstance;
    }
    
    /**
     * Haupt-Interface: Lässt AI eine Karte wählen
     */
    selectCard(playerId, playableCards, gameContext) {
        const aiData = this.aiPlayers.get(playerId);
        
        if (!aiData) {
            console.warn(`⚠️ Keine AI für Spieler ${playerId}, initialisiere Standard-AI`);
            this.initializeAI(playerId);
            return this.selectCard(playerId, playableCards, gameContext);
        }
        
        const startTime = performance.now();
        let selectedCard;
        
        try {
            // Sichere State/Action für Learning
            if (aiData.type === 'qlearning') {
                const state = aiData.instance.encodeGameState(gameContext);
                const action = aiData.instance.encodeAction(selectedCard || playableCards[0]);
                this.recordStateAction(playerId, state, action);
            }
            
            selectedCard = aiData.instance.selectCard(playableCards, gameContext);
            
        } catch (error) {
            console.error(`❌ AI-Fehler für Spieler ${playerId}:`, error);
            selectedCard = playableCards[0]; // Emergency fallback
        }
        
        const duration = performance.now() - startTime;
        if (duration > 100) {
            console.log(`⏱️ AI ${aiData.type} Spieler ${playerId}: ${duration.toFixed(1)}ms`);
        }
        
        return selectedCard;
    }
    
    /**
     * Learning-Integration: Trick-Ende
     */
    onTrickCompleted(trickResult, gameContext) {
        for (const [playerId, aiData] of this.aiPlayers.entries()) {
            if (aiData.type === 'qlearning' && this.enableLearning) {
                try {
                    const reward = aiData.instance.calculateReward(trickResult);
                    
                    if (aiData.lastState && aiData.lastAction) {
                        const nextState = aiData.instance.encodeGameState(gameContext);
                        const done = gameContext.trickNumber >= 8;
                        
                        aiData.instance.addExperience(
                            aiData.lastState, aiData.lastAction, 
                            reward, nextState, done
                        );
                    }
                    
                    // Kartengedächtnis
                    trickResult.cards.forEach((card, index) => {
                        aiData.instance.cardMemory.recordCard(
                            card, trickResult.players[index], gameContext.trickNumber
                        );
                    });
                    
                } catch (error) {
                    console.error(`❌ Trick-Learning Fehler Spieler ${playerId}:`, error);
                }
            }
        }
    }
    
    /**
     * Learning-Integration: Spiel-Ende
     */
    onGameCompleted(gameResult) {
        for (const [playerId, aiData] of this.aiPlayers.entries()) {
            if (aiData.type === 'qlearning' && this.enableLearning) {
                try {
                    const playerResult = {
                        won: gameResult.winners.includes(playerId),
                        score: gameResult.scores[playerId] || 0,
                        teamWin: this.isTeamWin(playerId, gameResult)
                    };
                    
                    aiData.instance.trainAfterGame(playerResult);
                    
                    qLearningMonitor.recordGame(playerId, {
                        ...playerResult,
                        explorationRate: aiData.instance.explorationRate
                    });
                    
                    if (this.autoSave) {
                        aiData.instance.saveToStorage();
                    }
                    
                } catch (error) {
                    console.error(`❌ Game-Learning Fehler Spieler ${playerId}:`, error);
                }
            }
        }
        
        this.analyzePerformance();
    }
    
    recordStateAction(playerId, state, action) {
        const aiData = this.aiPlayers.get(playerId);
        if (aiData && aiData.type === 'qlearning') {
            aiData.lastState = state;
            aiData.lastAction = action;
        }
    }
    
    /**
     * Legacy-Fallback für strategische Bots
     */
    selectCardWithStrategicBot(playableCards, playerIndex, gameContext) {
        // TODO: Integration mit strategic-bots.js
        return this.simpleCardSelection(playableCards, gameContext);
    }
    
    simpleCardSelection(playableCards, gameContext) {
        const trumpCards = playableCards.filter(card => 
            this.isTrump(card, gameContext));
        
        if (trumpCards.length > 0) {
            return trumpCards.reduce((lowest, card) => 
                this.getCardValue(lowest) < this.getCardValue(card) ? lowest : card
            );
        }
        
        return playableCards.reduce((lowest, card) => 
            this.getCardValue(lowest) < this.getCardValue(card) ? lowest : card
        );
    }
    
    analyzePerformance() {
        const report = qLearningMonitor.getReport();
        
        for (const [aiId, stats] of Object.entries(report)) {
            if (stats.recentWinRate < 0.2 && stats.totalGames > 50) {
                const aiData = this.aiPlayers.get(parseInt(aiId));
                if (aiData && aiData.type === 'qlearning') {
                    aiData.instance.explorationRate *= 0.9;
                    console.log(`📈 AI ${aiId}: Exploration reduziert auf ${aiData.instance.explorationRate.toFixed(3)}`);
                }
            }
            
            if (stats.recentWinRate > 0.8 && stats.totalGames > 100) {
                const aiData = this.aiPlayers.get(parseInt(aiId));
                if (aiData && aiData.type === 'qlearning') {
                    aiData.instance.explorationRate = Math.min(0.4, aiData.instance.explorationRate * 1.1);
                    console.log(`📉 AI ${aiId}: Exploration erhöht auf ${aiData.instance.explorationRate.toFixed(3)}`);
                }
            }
        }
    }
    
    initializeAllBots(aiType = null, configs = {}) {
        for (let playerId = 1; playerId <= 3; playerId++) {
            const playerConfig = configs[playerId] || {};
            this.initializeAI(playerId, aiType, playerConfig);
        }
        console.log(`🚀 Alle Bots initialisiert mit AI-Typ: ${aiType || this.defaultAIType}`);
    }
    
    isTeamWin(playerId, gameResult) {
        if (gameResult.gameType === 'rufspiel') {
            const team = gameResult.teams[playerId];
            return gameResult.winningTeam === team;
        }
        return gameResult.winners.includes(playerId);
    }
    
    isTrump(card, gameContext) {
        const trumpSuit = gameContext.trumpSuit;
        
        if (card.value === 'ober' || card.value === 'unter') {
            return true;
        }
        
        if (gameContext.gameType === 'wenz') {
            return card.value === 'unter';
        }
        
        return card.suit === trumpSuit;
    }
    
    getCardValue(card) {
        const values = {
            '7': 1, '8': 2, '9': 3, 'unter': 4, 'ober': 5, 
            '10': 6, 'ass': 7, 'könig': 8
        };
        return values[card.value.toLowerCase()] || 0;
    }
    
    saveAll() {
        let savedCount = 0;
        for (const [playerId, aiData] of this.aiPlayers.entries()) {
            if (aiData.type === 'qlearning') {
                try {
                    aiData.instance.saveToStorage();
                    savedCount++;
                } catch (error) {
                    console.error(`❌ Fehler beim Speichern AI ${playerId}:`, error);
                }
            }
        }
        console.log(`💾 ${savedCount} AI-Instanzen gespeichert`);
    }
    
    getFullReport() {
        const report = {
            timestamp: new Date().toISOString(),
            aiInstances: {},
            globalStats: qLearningMonitor.getReport(),
            configuration: {
                defaultAIType: this.defaultAIType,
                enableLearning: this.enableLearning,
                autoSave: this.autoSave
            }
        };
        
        for (const [playerId, aiData] of this.aiPlayers.entries()) {
            if (aiData.type === 'qlearning') {
                report.aiInstances[playerId] = {
                    type: aiData.type,
                    stats: aiData.instance.getStats(),
                    uptime: Date.now() - aiData.createdAt
                };
            } else {
                report.aiInstances[playerId] = {
                    type: aiData.type,
                    uptime: Date.now() - aiData.createdAt
                };
            }
        }
        
        return report;
    }
}

/**
 * Strategischer Bot als Fallback
 */
class StrategicBot {
    constructor(playerId, config = {}) {
        this.playerId = playerId;
        this.difficulty = config.difficulty || 'medium';
    }
    
    selectCard(playableCards, gameContext) {
        // Vereinfachte strategische Logik
        return playableCards[Math.floor(Math.random() * playableCards.length)];
    }
}

/**
 * Hybrid AI: Kombiniert Q-Learning mit Regeln
 */
class HybridAI {
    constructor(playerId, config = {}) {
        this.playerId = playerId;
        this.qLearning = new SchafkopfQLearning(playerId, config.qlearning || {});
        this.strategicBot = new StrategicBot(playerId, config.strategic || {});
        
        this.mlWeight = config.mlWeight || 0.7;
        this.safetyMode = config.safetyMode || true;
    }
    
    selectCard(playableCards, gameContext) {
        if (this.safetyMode) {
            const safeCards = this.filterUnsafeCards(playableCards, gameContext);
            if (safeCards.length > 0) {
                playableCards = safeCards;
            }
        }
        
        if (Math.random() < this.mlWeight) {
            return this.qLearning.selectCard(playableCards, gameContext);
        } else {
            return this.strategicBot.selectCard(playableCards, gameContext);
        }
    }
    
    filterUnsafeCards(playableCards, gameContext) {
        return playableCards; // TODO: Regel-basierte Safety-Checks
    }
}

// Global Bot-Manager Instance
export const botManager = new BotManager();

// Legacy-Kompatibilität
export function selectCardWithAI(playableCards, playerIndex, gameContext) {
    return botManager.selectCard(playerIndex, playableCards, gameContext);
}